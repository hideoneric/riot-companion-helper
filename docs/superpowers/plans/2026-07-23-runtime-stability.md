# Runtime Stability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Repair process detection, helper recognition, Windows login startup, and true background tray startup in Riot Companion Helper v2.0.9.

**Architecture:** Keep v2.0.9 state machine. Replace blocked shell boundaries with one PowerShell process snapshot and Electron login API. Port only helper process-name selection from `master`; do not merge old fixed-slot UI.

**Tech Stack:** Electron 39, TypeScript 5.9, React 19, Vitest 4, electron-vite 5, Windows PowerShell 5.1.

## Global Constraints

- No new package or native Node addon.
- Process polling uses one snapshot per tick.
- Existing settings migrate without data loss.
- `.exe` and `.lnk` helper paths remain valid.
- Errors keep real cause in logs; tray notification remains rate-limited.
- `startMinimized: true` means no visible or taskbar window.
- No worktree deletion before repaired branch integration and full verification.
- TDD order: failing test, observed failure, minimal code, passing test.

---

### Task 1: Replace blocked `tasklist` detector

**Files:**
- Modify: `src/main/process-detector.ts`
- Modify: `src/main/poller.ts`
- Test: `tests/process-detector.test.ts`
- Test: `tests/poller.test.ts`

**Interfaces:**
- Produces: `PowerShellProcessDetector.snapshot(): Promise<Set<string>>`
- Produces: `parsePowerShellProcessNames(output: string): Set<string>`
- Preserves: `ProcessDetector.snapshot(): Promise<Set<string>>`

- [ ] **Step 1: Replace parser tests with failing PowerShell-output tests**

```ts
import { execFile } from 'child_process'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  parsePowerShellProcessNames,
  PowerShellProcessDetector
} from '../src/main/process-detector'

vi.mock('child_process', () => ({ execFile: vi.fn() }))

describe('PowerShellProcessDetector', () => {
  beforeEach(() => vi.clearAllMocks())

  it('normalizes newline-delimited process names', () => {
    expect([
      ...parsePowerShellProcessNames('LeagueClient.exe\r\nVALORANT.exe\r\nBlitz.exe\r\n')
    ]).toEqual(['leagueclient.exe', 'valorant.exe', 'blitz.exe'])
  })

  it('adds exe suffix and removes empty duplicates', () => {
    expect([...parsePowerShellProcessNames('Blitz\n\nblitz\nRiotClientServices.exe\n')]).toEqual([
      'blitz.exe',
      'riotclientservices.exe'
    ])
  })

  it('runs hidden Windows PowerShell without a profile', async () => {
    vi.mocked(execFile).mockImplementationOnce((file, args, options, callback) => {
      expect(String(file).toLowerCase()).toMatch(/powershell\.exe$/)
      expect(args).toEqual(
        expect.arrayContaining(['-NoLogo', '-NoProfile', '-NonInteractive', '-Command'])
      )
      expect(options).toEqual(expect.objectContaining({ windowsHide: true, timeout: 5000 }))
      callback?.(null, 'LeagueClient\n', '')
      return undefined as never
    })

    await expect(new PowerShellProcessDetector().snapshot()).resolves.toEqual(
      new Set(['leagueclient.exe'])
    )
  })

  it('preserves execution failures', async () => {
    vi.mocked(execFile).mockImplementationOnce((_file, _args, _options, callback) => {
      callback?.(new Error('PowerShell denied'), '', '')
      return undefined as never
    })

    await expect(new PowerShellProcessDetector().snapshot()).rejects.toThrow('PowerShell denied')
  })
})
```

- [ ] **Step 2: Run detector tests and observe RED**

Run:

```powershell
npm test -- tests/process-detector.test.ts
```

Expected: FAIL because `PowerShellProcessDetector` and `parsePowerShellProcessNames` do not exist.

- [ ] **Step 3: Implement minimum PowerShell detector**

Replace `src/main/process-detector.ts` with:

```ts
import { execFile } from 'child_process'
import * as path from 'path'

export interface ProcessDetector {
  snapshot(): Promise<Set<string>>
}

const POWERSHELL_PATH = path.join(
  process.env.SystemRoot ?? 'C:\\Windows',
  'System32',
  'WindowsPowerShell',
  'v1.0',
  'powershell.exe'
)
const PROCESS_COMMAND =
  "Get-Process -ErrorAction SilentlyContinue | Select-Object -ExpandProperty ProcessName"

export class PowerShellProcessDetector implements ProcessDetector {
  snapshot(): Promise<Set<string>> {
    return new Promise((resolve, reject) => {
      execFile(
        POWERSHELL_PATH,
        ['-NoLogo', '-NoProfile', '-NonInteractive', '-Command', PROCESS_COMMAND],
        {
          encoding: 'utf8',
          maxBuffer: 1024 * 1024,
          timeout: 5000,
          windowsHide: true
        },
        (error, stdout) => {
          if (error) {
            reject(error)
            return
          }
          resolve(parsePowerShellProcessNames(stdout))
        }
      )
    })
  }
}

export function parsePowerShellProcessNames(output: string): Set<string> {
  const names = output
    .split(/\r?\n/)
    .map((name) => name.trim().toLowerCase())
    .filter(Boolean)
    .map((name) => (name.endsWith('.exe') ? name : `${name}.exe`))

  return new Set(names)
}
```

Update `src/main/poller.ts` import and default:

```ts
import { PowerShellProcessDetector } from './process-detector'

constructor(private opts: PollerOptions) {
  this.processDetector = opts.processDetector ?? new PowerShellProcessDetector()
}
```

- [ ] **Step 4: Add failing poller error-detail test**

Append inside `describe('Poller state machine', ...)`:

```ts
it('logs the process detector error after three consecutive failures', async () => {
  vi.mocked(detector.snapshot).mockRejectedValue(new Error('PowerShell denied'))

  await poller.tick()
  await poller.tick()
  await poller.tick()

  expect(onLog).toHaveBeenCalledWith(
    expect.objectContaining({
      level: 'error',
      message: expect.stringContaining('PowerShell denied')
    })
  )
})
```

- [ ] **Step 5: Run poller test and observe RED**

Run:

```powershell
npm test -- tests/poller.test.ts
```

Expected: FAIL because current catch logs only generic permissions text.

- [ ] **Step 6: Preserve real error in poller log**

Replace detector catch in `runTick()`:

```ts
} catch (error) {
  this.consecutiveErrors++
  if (this.consecutiveErrors === 3) {
    const reason = error instanceof Error ? error.message : String(error)
    this.log(`Process detection error: ${reason}`, 'error')
    this.opts.onTrayNotify?.(
      'Riot Companion Helper',
      'Process detection failed — see activity log'
    )
  }
  return
}
```

- [ ] **Step 7: Verify GREEN**

Run:

```powershell
npm test -- tests/process-detector.test.ts tests/poller.test.ts
```

Expected: both files PASS.

- [ ] **Step 8: Commit**

```powershell
git add src/main/process-detector.ts src/main/poller.ts tests/process-detector.test.ts tests/poller.test.ts
git commit -m "fix: replace blocked process detection"
```

---

### Task 2: Restore helper process identity

**Files:**
- Modify: `src/main/settings-store.ts`
- Modify: `src/main/poller.ts`
- Modify: `src/main/index.ts`
- Modify: `src/main/ipc-handlers.ts`
- Modify: `src/renderer/src/App.tsx`
- Test: `tests/settings-store.test.ts`
- Test: `tests/poller.test.ts`
- Test: `tests/ipc-handlers.test.ts`

**Interfaces:**
- Adds: `HelperConfig.processName?: string`
- Adds: `Poller.setBlitzProcessName(name: string): void`
- Adds: `Poller.setPorofessorProcessName(name: string): void`

- [ ] **Step 1: Add failing settings migration test**

Append to `tests/settings-store.test.ts`:

```ts
it('persists a selected helper process name', () => {
  const settings = getSettings()
  settings.helpers[0] = {
    ...settings.helpers[0],
    path: 'C:\\Helpers\\Blitz.lnk',
    processName: 'Blitz.exe',
    enabled: true
  }

  saveSettings(settings)

  expect(getSettings().helpers[0].processName).toBe('Blitz.exe')
})
```

- [ ] **Step 2: Run settings test and observe RED**

Run:

```powershell
npm test -- tests/settings-store.test.ts
```

Expected: FAIL because `processName` is dropped by normalization.

- [ ] **Step 3: Persist optional process name**

Add to both `HelperConfig` interfaces in `src/main/settings-store.ts` and `src/renderer/src/App.tsx`:

```ts
processName?: string
```

Add to `normalizeHelpers()` return:

```ts
processName: stored?.processName ?? '',
```

- [ ] **Step 4: Add failing `.lnk` external-helper poller test**

Append to `tests/poller.test.ts`:

```ts
it('recognizes an externally started helper selected for a shortcut', async () => {
  poller.setPorofessorPath('C:\\Start Menu\\Valorant Tracker.lnk')
  poller.setPorofessorProcessName('Overwolf.exe')
  setRunning('Overwolf.exe')

  await poller.tick()

  expect(onState).toHaveBeenLastCalledWith(
    expect.objectContaining({ porofessorRunning: true })
  )
  expect(mockPorofessorLauncher.launch).not.toHaveBeenCalled()
})
```

- [ ] **Step 5: Run poller test and observe RED**

Run:

```powershell
npm test -- tests/poller.test.ts
```

Expected: FAIL because process-name setters do not exist.

- [ ] **Step 6: Add process-name state and use it for recognition**

Add fields and setters in `src/main/poller.ts`:

```ts
private blitzProcessName = 'Blitz.exe'
private porofessorProcessName = ''

setBlitzProcessName(name: string) {
  this.blitzProcessName = name.trim() || 'Blitz.exe'
}

setPorofessorProcessName(name: string) {
  this.porofessorProcessName = name.trim()
}
```

Replace helper detection:

```ts
private isBlitzRunning(processes = this.lastProcesses): boolean {
  return (
    this.hasProcess(processes, this.blitzProcessName) ||
    this.opts.launcher.launchedPid != null
  )
}

private isPorofessorRunning(processes = this.lastProcesses): boolean {
  if (!this._porofessorPath) return false
  const exeName = this.porofessorProcessName || path.basename(this._porofessorPath)
  if (!exeName.toLowerCase().endsWith('.exe')) {
    return this.opts.porofessorLauncher.launchedPid != null
  }
  return this.hasProcess(processes, exeName) || this.opts.porofessorLauncher.launchedPid != null
}
```

Use snapshot-aware duplicate checks:

```ts
if (anyEnabledRunning && !this.anyEnabledWasRunning) {
  if (this.isBlitzRunning(processes)) {
    this.log('Blitz.gg already running — skipping launch')
  } else if (this._blitzPath && this.blitzEnabled) {
    // existing launch block
  }
}

if (porofessorBoundGameRunning && !this.porofessorWasRunningForBinding) {
  if (this.isPorofessorRunning(processes)) {
    this.log('Porofessor already running — skipping launch')
  } else if (this._porofessorPath && this.porofessorEnabled) {
    // existing launch block
  }
}
```

Update forget methods to delete configured names:

```ts
this.forgetProcess(this.blitzProcessName)
```

```ts
const name = this.porofessorProcessName || path.basename(this._porofessorPath)
this.forgetProcess(name)
```

- [ ] **Step 7: Wire settings into startup and saves**

In `src/main/index.ts`, after helper paths:

```ts
poller.setBlitzProcessName(settings.helpers[0]?.processName ?? '')
poller.setPorofessorProcessName(settings.helpers[1]?.processName ?? '')
```

In `src/main/ipc-handlers.ts`, after helper paths:

```ts
poller.setBlitzProcessName(primaryHelper?.processName ?? '')
poller.setPorofessorProcessName(secondaryHelper?.processName ?? '')
```

Add to `shouldRefreshPollingState()` comparison:

```ts
previousHelper.processName !== nextHelper.processName ||
```

- [ ] **Step 8: Add refresh-state regression test**

Append to `tests/ipc-handlers.test.ts`:

```ts
it('refreshes when a helper process selection changes', () => {
  const next = {
    ...baseSettings,
    helpers: baseSettings.helpers.map((helper) =>
      helper.id === 'helper-1' ? { ...helper, processName: 'Blitz.exe' } : helper
    )
  }

  expect(shouldRefreshPollingState(baseSettings, next)).toBe(true)
})
```

- [ ] **Step 9: Verify GREEN**

Run:

```powershell
npm test -- tests/settings-store.test.ts tests/poller.test.ts tests/ipc-handlers.test.ts
```

Expected: all three files PASS.

- [ ] **Step 10: Commit**

```powershell
git add src/main/settings-store.ts src/main/poller.ts src/main/index.ts src/main/ipc-handlers.ts src/renderer/src/App.tsx tests/settings-store.test.ts tests/poller.test.ts tests/ipc-handlers.test.ts
git commit -m "fix: restore helper process selection"
```

---

### Task 3: Expose shared process list in helper settings

**Files:**
- Modify: `src/main/ipc-handlers.ts`
- Modify: `src/main/index.ts`
- Modify: `src/preload/index.ts`
- Modify: `src/renderer/src/App.tsx`
- Modify: `src/renderer/src/components/ControlInspector.tsx`
- Test: `tests/ipc-handlers.test.ts`

**Interfaces:**
- Adds: `ProcessOption = { name: string }`
- Adds: `listProcessOptions(detector: ProcessDetector): Promise<ProcessOption[]>`
- Adds: `window.api.listProcesses(): Promise<ProcessOption[]>`

- [ ] **Step 1: Add failing process-list tests**

Add imports to `tests/ipc-handlers.test.ts`:

```ts
import { listProcessOptions } from '../src/main/ipc-handlers'
import type { ProcessDetector } from '../src/main/process-detector'
```

Append:

```ts
describe('listProcessOptions', () => {
  it('sorts one shared detector snapshot', async () => {
    const detector: ProcessDetector = {
      snapshot: async () => new Set(['valorant.exe', 'blitz.exe'])
    }

    await expect(listProcessOptions(detector)).resolves.toEqual([
      { name: 'blitz.exe' },
      { name: 'valorant.exe' }
    ])
  })

  it('preserves detector errors', async () => {
    const detector: ProcessDetector = {
      snapshot: async () => {
        throw new Error('snapshot failed')
      }
    }

    await expect(listProcessOptions(detector)).rejects.toThrow('snapshot failed')
  })
})
```

- [ ] **Step 2: Run IPC tests and observe RED**

Run:

```powershell
npm test -- tests/ipc-handlers.test.ts
```

Expected: FAIL because `listProcessOptions` does not exist.

- [ ] **Step 3: Add shared detector handler**

In `src/main/ipc-handlers.ts`:

```ts
import type { ProcessDetector } from './process-detector'

export interface ProcessOption {
  name: string
}

export async function listProcessOptions(
  detector: ProcessDetector
): Promise<ProcessOption[]> {
  const names = [...(await detector.snapshot())].sort()
  return names.map((name) => ({ name }))
}

export function registerIpcHandlers(poller: Poller, detector: ProcessDetector) {
  // existing handlers
  ipcMain.handle('processes:list', () => listProcessOptions(detector))
}
```

In `src/main/index.ts`, share one detector:

```ts
import { PowerShellProcessDetector } from './process-detector'

const processDetector = new PowerShellProcessDetector()

const poller = new Poller({
  launcher,
  porofessorLauncher,
  processDetector,
  // existing callbacks
})

registerIpcHandlers(poller, processDetector)
```

- [ ] **Step 4: Expose typed preload call**

In `src/preload/index.ts`:

```ts
listProcesses: () => ipcRenderer.invoke('processes:list'),
```

In renderer `window.api` declarations:

```ts
listProcesses: () => Promise<Array<{ name: string }>>
```

- [ ] **Step 5: Add native process selector to helper card**

In `HelperSettingsCard`:

```ts
const [processValue, setProcessValue] = useState(helper.processName ?? '')
const [processes, setProcesses] = useState<Array<{ name: string }>>([])
const [processError, setProcessError] = useState('')

useEffect(() => setProcessValue(helper.processName ?? ''), [helper.processName])

const refreshProcesses = useCallback(async () => {
  setProcessError('')
  try {
    setProcesses(await window.api.listProcesses())
  } catch (error) {
    setProcessError(error instanceof Error ? error.message : String(error))
  }
}, [])
```

Add after path field:

```tsx
<label>
  <span>Process</span>
  <div className="path-field">
    <input
      className="input"
      value={processValue}
      onChange={(event) => setProcessValue(event.target.value)}
      onBlur={() => saveHelper({ processName: processValue.trim() })}
      list={`${helper.id}-processes`}
      placeholder="Helper.exe"
    />
    <button
      className="icon-button"
      onClick={refreshProcesses}
      aria-label={`Refresh process list for ${fallbackName}`}
    >
      <Icon name="sync" />
    </button>
  </div>
  <datalist id={`${helper.id}-processes`}>
    {processes.map((process) => (
      <option key={process.name} value={process.name} />
    ))}
  </datalist>
</label>
{processError && <div className="field-error">{processError}</div>}
```

Add `processName: ''` to `handleRemove()` patch.

- [ ] **Step 6: Verify GREEN and renderer contract**

Run:

```powershell
npm test -- tests/ipc-handlers.test.ts
npm run typecheck
npm run build
```

Expected: test PASS; typecheck and build exit 0.

- [ ] **Step 7: Commit**

```powershell
git add src/main/ipc-handlers.ts src/main/index.ts src/preload/index.ts src/renderer/src/App.tsx src/renderer/src/components/ControlInspector.tsx tests/ipc-handlers.test.ts
git commit -m "feat: select helper process from running apps"
```

---

### Task 4: Repair login startup and true tray background start

**Files:**
- Modify: `src/main/startup.ts`
- Modify: `src/main/window-startup.ts`
- Modify: `src/main/index.ts`
- Modify: `src/main/ipc-handlers.ts`
- Create: `tests/startup.test.ts`
- Modify: `tests/window-startup.test.ts`

**Interfaces:**
- Preserves: `setLaunchWithWindows(enabled: boolean): void`
- Preserves: `presentWindowOnReady(win, startMinimized): void`

- [ ] **Step 1: Add failing native login-item test**

Create `tests/startup.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { setLoginItemSettings } = vi.hoisted(() => ({
  setLoginItemSettings: vi.fn()
}))

vi.mock('electron', () => ({
  app: { setLoginItemSettings }
}))

import { setLaunchWithWindows } from '../src/main/startup'

describe('setLaunchWithWindows', () => {
  beforeEach(() => vi.clearAllMocks())

  it('uses Electron login-item registration', () => {
    setLaunchWithWindows(true)
    expect(setLoginItemSettings).toHaveBeenCalledWith({ openAtLogin: true })
  })

  it('disables Electron login-item registration', () => {
    setLaunchWithWindows(false)
    expect(setLoginItemSettings).toHaveBeenCalledWith({ openAtLogin: false })
  })
})
```

- [ ] **Step 2: Run startup test and observe RED**

Run:

```powershell
npm test -- tests/startup.test.ts
```

Expected: FAIL because current code calls `app.getPath()` and `reg.exe`.

- [ ] **Step 3: Replace registry shell command**

Replace `src/main/startup.ts`:

```ts
import { app } from 'electron'

export function setLaunchWithWindows(enabled: boolean): void {
  app.setLoginItemSettings({ openAtLogin: enabled })
}
```

- [ ] **Step 4: Change window test to true background behavior**

Replace minimized test in `tests/window-startup.test.ts`:

```ts
it('keeps the main window hidden for background startup', () => {
  const win = {
    show: vi.fn(),
    minimize: vi.fn()
  }

  presentWindowOnReady(win, true)

  expect(win.show).not.toHaveBeenCalled()
  expect(win.minimize).not.toHaveBeenCalled()
})
```

- [ ] **Step 5: Run window test and observe RED**

Run:

```powershell
npm test -- tests/window-startup.test.ts
```

Expected: FAIL because current code calls both methods.

- [ ] **Step 6: Omit presentation during background startup**

Replace `src/main/window-startup.ts`:

```ts
type StartupWindow = {
  show: () => void
}

export function presentWindowOnReady(win: StartupWindow, startMinimized: boolean): void {
  if (!startMinimized) win.show()
}
```

- [ ] **Step 7: Reconcile saved login setting at startup**

Import `setLaunchWithWindows` in `src/main/index.ts` and call after loading settings:

```ts
try {
  setLaunchWithWindows(settings.launchWithWindows)
} catch (error) {
  console.error('Failed to update Windows startup registration:', error)
}
```

Update the settings-save catch in `src/main/ipc-handlers.ts`:

```ts
try {
  setLaunchWithWindows(newSettings.launchWithWindows)
} catch (error) {
  console.error('Failed to update Windows startup registration:', error)
}
```

- [ ] **Step 8: Verify GREEN**

Run:

```powershell
npm test -- tests/startup.test.ts tests/window-startup.test.ts
npm run typecheck
```

Expected: tests PASS; typecheck exits 0.

- [ ] **Step 9: Commit**

```powershell
git add src/main/startup.ts src/main/window-startup.ts src/main/index.ts src/main/ipc-handlers.ts tests/startup.test.ts tests/window-startup.test.ts
git commit -m "fix: start reliably in Windows tray"
```

---

### Task 5: Release, real runtime verification, integration, cleanup

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Generated: `dist/*`

**Interfaces:**
- Produces: Windows installer version `2.0.10`
- Proves: installed runtime behavior, not only unit behavior

- [ ] **Step 1: Bump patch version**

Run:

```powershell
npm version 2.0.10 --no-git-tag-version
```

Expected: `package.json` and `package-lock.json` both report `2.0.10`.

- [ ] **Step 2: Run full fresh verification**

Run:

```powershell
npm test
npm run typecheck
npm run lint
npm run build
```

Expected: all commands exit 0; no test failures, TypeScript errors, or ESLint errors.

- [ ] **Step 3: Build Windows installer**

Run:

```powershell
npm run build:win
```

Expected: electron-builder exits 0 and creates v2.0.10 installer plus update metadata in `dist`.

- [ ] **Step 4: Install v2.0.10**

Close running v2.0.9 through tray Quit, run generated installer, then verify executable ProductVersion is `2.0.10`.

- [ ] **Step 5: Verify process detection in real runtime**

With existing `pollingInterval: 3`, keep app running for at least 15 seconds.

Expected:

- no “Process detection error” balloon;
- activity log has no detector failure;
- process selector refresh returns running `.exe` names;
- selecting configured helper process persists after restart.

- [ ] **Step 6: Verify Windows login registration**

Inspect:

```powershell
Get-ItemProperty 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Run'
```

or Electron login settings.

Expected: Riot Companion Helper login entry exists while `launchWithWindows: true`.

- [ ] **Step 7: Verify true background launch**

Quit app, launch executable once with saved `startMinimized: true`, wait for renderer readiness.

Expected:

- tray icon exists;
- no visible window;
- no taskbar button;
- tray click shows and focuses window;
- close button hides back to tray.

- [ ] **Step 8: Commit release version**

```powershell
git add package.json package-lock.json
git commit -m "chore: release 2.0.10"
```

- [ ] **Step 9: Integrate repaired branch**

Use `superpowers:finishing-a-development-branch`. Merge repaired `worktree-agent-a5f91185` into `master`, resolve only semantic overlap, then rerun:

```powershell
npm test
npm run typecheck
npm run lint
npm run build
```

Expected: merged tree passes same full gate.

- [ ] **Step 10: Clean redundant worktrees only after typed discard confirmation**

Exact candidates:

- `.openclaude/worktrees/agent-ae543c53`
- `.worktrees/theme-color`
- `C:\Users\erik_\.codex\worktrees\0085\Riot Companion Helper`

Before deletion, repeat status/hash checks. Then require user to type `discard`, remove owned worktrees from main repo, and run:

```powershell
git worktree prune
git worktree list --porcelain
```

Expected: only active main/repaired worktrees remain; no unique commit or file lost.
