# Runtime Stability Design

## Goal

Make Riot Companion Helper reliable on this Windows installation: process detection must work without `tasklist.exe`, configured helpers must be recognized even when launched externally, Windows startup must be registered without shelling out to `reg.exe`, and “Start minimized” must launch directly into the tray without briefly showing or minimizing a window.

## Confirmed Causes

- `tasklist.exe /FO CSV /NH` exits with `ERROR: Access denied`, so every polling tick aborts before game or helper state can be updated.
- `setLaunchWithWindows()` shells out to `reg.exe`, catches failures, and leaves `launchWithWindows: true` in settings while no Run entry exists.
- `presentWindowOnReady()` always calls `show()` and then `minimize()`, which creates a taskbar window instead of a background tray start.
- The v2.0.9 helper model stores a path and display name but no executable process name. For `.lnk` helpers, externally started processes cannot be recognized. The `master` branch contains process selection, but its older settings and renderer models cannot be merged wholesale into v2.0.9.

## Architecture

Keep the existing v2.0.9 branch and its `Poller` state machine. Replace only the failing boundaries:

1. A process detector runs an absolute Windows PowerShell executable with `Get-Process`, parses newline-delimited process names, and returns the existing lowercase `Set<string>` snapshot.
2. The same detector supplies the settings UI process list, avoiding a second process-enumeration implementation.
3. Each `HelperConfig` stores an optional `processName`. The poller uses that name first, then an `.exe` path basename, then its own launched PID.
4. Electron’s native `app.setLoginItemSettings()` owns Windows login registration.
5. Window presentation omits `show()` entirely when background startup is requested.

No new package or native Node addon is introduced.

## Components

### Process detector

`src/main/process-detector.ts` keeps the `ProcessDetector` interface. Its production implementation uses:

- `%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe`
- `-NoLogo -NoProfile -NonInteractive`
- `Get-Process -ErrorAction SilentlyContinue | Select-Object -ExpandProperty ProcessName`
- a bounded timeout and hidden child window

Parsing appends `.exe` when PowerShell returns a bare process name, lowercases names, removes duplicates, and ignores empty output. Execution errors preserve their real message for logging.

### Poller and helper identity

`HelperConfig.processName` is optional for migration safety. Poller helper detection resolves identity in this order:

1. configured `processName`;
2. basename of a configured `.exe`;
3. launcher-owned PID.

This restores the useful `master` behavior without importing its obsolete fixed-slot architecture. The existing single snapshot per tick remains; no per-helper subprocess is added.

### Settings and IPC

The main process exposes one IPC handler that converts the shared detector snapshot into sorted `{ name }` options. Preload exposes it through the existing safe bridge. The helper settings card adds a process-name input/datalist and refresh action. Saving a helper preserves all existing fields and migrations.

### Windows login startup

`setLaunchWithWindows()` calls `app.setLoginItemSettings({ openAtLogin: enabled })`. Application startup reconciles the persisted setting once, so an existing `launchWithWindows: true` repairs missing registration without requiring the user to toggle the setting.

### Background window startup

`presentWindowOnReady(win, false)` shows the window. `presentWindowOnReady(win, true)` performs no show or minimize action. Tray click and second-instance behavior still show and focus the window.

## Error Handling

- Process detection keeps the existing three-consecutive-failure notification threshold.
- Logs include the underlying execution error instead of only “check app permissions.”
- A successful snapshot resets the failure counter.
- Startup-registration failure is logged but does not crash the tray app.
- Process-list IPC returns a rejected call with the real error; the renderer keeps current helper settings and shows refresh failure state.

## Verification

TDD adds or updates tests for:

- PowerShell process-name parsing and command execution contract;
- detector failure propagation;
- one detector snapshot per poll;
- configured helper `processName` detection for `.lnk` paths;
- process-list IPC sorting and error propagation;
- native login-item registration;
- startup reconciliation;
- normal window show versus zero presentation calls for background startup.

Completion also requires fresh `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`, Windows packaging, installation, and real runtime checks:

- no process-detection notification over multiple polling intervals;
- app registered for login while setting is enabled;
- background launch creates tray presence with no visible/taskbar window;
- tray click restores the window;
- configured helper process appears and can be selected.

## Branch and Worktree Resolution

- Implement on `worktree-agent-a5f91185`, the branch containing installed v2.0.9.
- Port only missing helper-process selection behavior from `master`; do not merge its obsolete UI and settings implementation wholesale.
- After implementation and merged-result tests, integrate the repaired v2 branch into `master`.
- Remove `worktree-agent-ae543c53` after preserving or discarding its sole untracked `.openclaude/settings.local.json`.
- Remove stale `.worktrees/theme-color` and its registration after explicit discard confirmation; its tracked content matches the already-merged branch except generated `package-lock.json` and `.eslintcache`.
- Remove orphaned Codex `0085` after explicit discard confirmation; its tracked source exactly matches `master` and contains no unique non-generated file.

No worktree is deleted before the repaired branch is integrated and its full verification passes.
