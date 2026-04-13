# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start in development mode (hot-reload)
npm run build        # Build all three targets (main, preload, renderer) → out/
npm run build:unpack # Build + unpack to dir (faster than full installer, for local testing)
npm run build:win    # Build + produce Windows installer (electron-builder)
npm run package      # Build + produce installer in dist/
npm run lint         # ESLint check
npm run typecheck    # TypeScript type-check (node + web targets)
npm run format       # Prettier format
npm test             # Run tests once (vitest run)
npm run test:watch   # Run tests in watch mode
npm run icon         # Regenerate icon.ico from resources/icon.png (via sharp)
```

Run a single test file: `npm test -- tests/poller.test.ts`

Tests live in `tests/**/*.test.ts` and run in a Node environment. All system calls (`tasklist`, `spawn`, `execSync`) are mocked — no processes are actually spawned during tests.

To create a GitHub release after packaging:
```bash
"/c/Program Files/GitHub CLI/gh.exe" release create vX.Y.Z "dist/riot-companion-helper-X.Y.Z-setup.exe" --title "vX.Y.Z - ..." --notes "..."
```

**Packaging note**: `npm run package` uses electron-builder and requires Windows Developer Mode enabled (Settings → System → For developers) to avoid symlink errors.

## Architecture

This is an Electron app with three compiled targets managed by `electron-vite`:

```
src/main/       → Node.js main process
src/preload/    → Context bridge (index.ts only)
src/renderer/   → React/TypeScript UI (single page, no router)
```

### Main process (`src/main/`)

The core data flow is:

```
index.ts  →  Poller (tick every N seconds)
              ├─ detects LeagueClient.exe / VALORANT.exe via tasklist
              ├─ launches/kills BlitzLauncher (shared for both games)
              └─ onStateChange → ipc-handlers.setCurrentState → webContents.send('state:update')
```

- **`index.ts`**: App entry. Creates window, poller, tray. IPC handlers registered **before** `createMainWindow()` to avoid race conditions. Uses `show: false` + `ready-to-show` pattern. Single-instance lock enforced.
- **`poller.ts`**: Polls on a `setInterval`. Tracks League + Valorant; Blitz launches when either game starts, kills when both stop. `broadcastIfChanged()` prevents redundant IPC sends.
- **`launcher.ts`**: `BlitzLauncher` (spawn/taskkill by PID+name). Supports `.lnk` shortcuts via `cmd /c start`.
- **`ipc-handlers.ts`**: Owns `currentState` object. All IPC `handle`/`on` registrations except `window:minimize`, `window:hide`, `settings:open` which live in `index.ts`.
- **`detector.ts`**: Auto-detect `Blitz.exe` path on disk.
- **`settings-store.ts`**: `electron-store` v8 (v11+ is ESM-only, breaks CJS main process). Fields: `blitzPath`, `launchWithWindows`, `pollingInterval`, `monitoringEnabled`, `leagueEnabled`, `valorantEnabled`.
- **`tray.ts`**: System tray icon. Quit calls `app.quit()` which works because `index.ts` sets `isQuitting = true` in `before-quit`, allowing the close handler to proceed.
- **`startup.ts`**: Windows registry (`HKCU\...\Run`) for launch-with-Windows.

### IPC surface

All `window.api.*` calls are bridged in `src/preload/index.ts`:

| method | direction | purpose |
|---|---|---|
| `getState()` | renderer→main | initial state snapshot |
| `onStateUpdate(cb)` | main→renderer push | live state changes |
| `onLogEntry(cb)` | main→renderer push | activity log entries |
| `getSettings()` / `saveSettings(s)` | renderer→main | persistent settings |
| `browse()` | renderer→main | file open dialog |
| `minimize()` / `hideToTray()` | renderer→main | window controls |
| `onNavigate(cb)` | main→renderer push | navigate to settings page |

### Renderer (`src/renderer/src/`)

Single-page layout (no router). `App.tsx` owns all state and passes it down:

- **`Titlebar`** (inline in App.tsx): full-width draggable bar, window controls top-right
- **`Sidebar`**: Home / Settings navigation with active left-border accent
- **`SubNav`**: shown only when Settings active (General / Behavior sub-pages)
- **`HomePage`**: monitoring status badge + two grouped process cards (GAMES: League+Valorant, COMPANION: Blitz) + scrollable activity log
- **`SettingsPage`**: General (Blitz path, polling interval) and Behavior (monitoring toggle, launch with Windows, per-game toggles)

`components/StatusPanel.tsx`, `components/ActivityLog.tsx`, and `components/Header.tsx` are unused legacy components superseded by the current layout. Do not delete them without confirming they are unreferenced.

### Code style

Prettier enforces: single quotes, no semicolons, 100-character line width, no trailing commas. Run `npm run format` before committing.

### Key constraints

- **Frame**: `frame: false` — window chrome is fully custom. `WebkitAppRegion: drag` on titlebar, `no-drag` on buttons.
- **ASAR**: Never manually repack the ASAR — Electron validates ASAR integrity against a hash embedded in the exe. Always rebuild with `npm run package`.
- **electron-store**: Pinned to v8. Do not upgrade to v11+.
- **Icon path**: In production use `process.resourcesPath` (not `__dirname`-relative) because `resources/` sits outside the ASAR. Dev uses `path.join(__dirname, '../../resources/icon.ico')`.
- **Poller startup condition**: Poller only starts if `monitoringEnabled && blitzPath`. If no path is set, the poller stays idle.
- **Auto-updater**: `electron-updater` checks GitHub releases on startup (3s delay, prod only). `initUpdater()` lives in `src/main/updater.ts`. Always include `latest.yml` in releases — electron-builder generates it automatically alongside the installer. The `publish.provider` in `electron-builder.yml` must stay set to `github` or updates will break. In dev mode `initUpdater` is skipped entirely.
