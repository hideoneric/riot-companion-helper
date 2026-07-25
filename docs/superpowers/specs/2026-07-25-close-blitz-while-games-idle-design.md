# Close Blitz While Games Are Idle

## Goal

Close Blitz within one polling interval whenever no enabled game bound to Blitz is running, including when Blitz was started outside Riot Companion Helper.

## Behavior

The poller remains the single owner of launch and shutdown decisions. On every successful process snapshot:

- If an enabled, Blitz-bound game is running, keep existing launch behavior.
- If no enabled, Blitz-bound game is running and Blitz is detected, close every `Blitz.exe` process.
- Do not close Blitz when process detection fails because game state is unknown.
- Keep disabled monitoring behavior unchanged.

With the current three-second polling setting, an externally started Blitz instance closes within about three seconds while League and Valorant are absent.

## Implementation

Change only the existing primary-helper branch in `src/main/poller.ts`. Reuse `isBlitzRunning(processes)` and `BlitzLauncher.killByName()`; add no new state, abstraction, dependency, or timer.

Add one regression test to `tests/poller.test.ts`:

1. Start with only `Blitz.exe` in the process snapshot.
2. Run one poll.
3. Assert `BlitzLauncher.killByName()` ran once.
4. Assert published state reports `blitzRunning: false`.

Existing transition test continues proving shutdown after League closes.

## Release

Bump patch version from `2.0.10` to `2.0.11` in package metadata. Run full tests, type checks, lint, and production build. Package Windows release assets and publish tag `v2.0.11` with:

- `riot-companion-helper-2.0.11-setup.exe`
- `riot-companion-helper-2.0.11-setup.exe.blockmap`
- `latest.yml`

Verify `latest.yml` names version `2.0.11`. Install the published installer on this system, then verify installed executable version `2.0.11` and that Riot Companion Helper starts.

## Non-Goals

- No grace period beyond the existing poll interval.
- No distinction between Helper-started and externally started Blitz.
- No changes to Porofessor or Valorant Tracker behavior.
- No UI or settings toggle for idle shutdown.
