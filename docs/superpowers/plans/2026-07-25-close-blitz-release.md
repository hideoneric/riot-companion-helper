# Close Blitz And Release 2.0.11 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close externally started Blitz while no enabled bound game runs; ship and install `v2.0.11`.

**Architecture:** Keep decision in `Poller.runTick()`. Reuse process snapshot, `isBlitzRunning()`, and `BlitzLauncher.killByName()`; no new state.

**Tech Stack:** TypeScript, Vitest, Electron, electron-builder, GitHub Releases, PowerShell.

## Global Constraints

- Work in isolated branch/worktree.
- TDD: watch regression test fail before source edit.
- Do not alter Porofessor behavior.
- Release must contain setup `.exe`, `.blockmap`, `latest.yml`.
- `latest.yml` version and installer must equal `2.0.11`.

---

### Task 1: Fix idle Blitz shutdown

**Files:**
- Modify: `tests/poller.test.ts`
- Modify: `src/main/poller.ts:169-194`

**Interfaces:**
- Consumes: `Poller.tick()`, `Poller.isBlitzRunning()`, `BlitzLauncher.killByName()`
- Produces: idle snapshot closes detected Blitz and broadcasts `blitzRunning: false`

- [ ] Add test:

```ts
it('kills externally started Blitz while no bound game is running', async () => {
  setRunning('Blitz.exe')
  await poller.tick()
  expect(BlitzLauncher.killByName).toHaveBeenCalledOnce()
  expect(onState).toHaveBeenLastCalledWith(expect.objectContaining({ blitzRunning: false }))
})
```

- [ ] Run `npm test -- tests/poller.test.ts`; expect new test FAIL: `killByName` called 0 times.
- [ ] Replace transition-only close condition with:

```ts
if (!anyEnabledRunning && this.isBlitzRunning(processes)) {
  await Promise.all([this.opts.launcher.kill(), BlitzLauncher.killByName()])
  stateProcesses.delete(this.blitzProcessName.toLowerCase())
  this.log('Blitz.gg closed')
}
```

- [ ] Run `npm test -- tests/poller.test.ts`; expect PASS.
- [ ] Commit: `fix(poller): close Blitz while games are idle`

### Task 2: Bump patch version

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Consumes: npm package metadata
- Produces: package version `2.0.11`

- [ ] Run `npm version 2.0.11 --no-git-tag-version`.
- [ ] Verify root version fields:

```powershell
$package = Get-Content package.json -Raw | ConvertFrom-Json
$lock = Get-Content package-lock.json -Raw | ConvertFrom-Json
if ($package.version -ne '2.0.11' -or $lock.version -ne '2.0.11' -or $lock.packages.''.version -ne '2.0.11') { throw 'Version mismatch' }
```

- [ ] Commit: `chore(release): bump version to 2.0.11`

### Task 3: Verify and package

**Files:**
- Read: all tracked source/config
- Generate: `dist/riot-companion-helper-2.0.11-setup.exe`
- Generate: `dist/riot-companion-helper-2.0.11-setup.exe.blockmap`
- Generate: `dist/latest.yml`

**Interfaces:**
- Consumes: committed `2.0.11` tree
- Produces: verified Windows release assets

- [ ] Run `npm test`.
- [ ] Run `npm run typecheck`.
- [ ] Run `npm run lint`.
- [ ] Run `npm run build`.
- [ ] Run `npm run build:win`.
- [ ] Verify three assets exist and are non-empty.
- [ ] Parse `dist/latest.yml`; verify `version: 2.0.11`, installer URL/name `riot-companion-helper-2.0.11-setup.exe`, matching SHA-512 and size fields exist.
- [ ] Run `git diff --check` and confirm clean tracked worktree.

### Task 4: Review, publish, install

**Files:**
- Upload: three verified `dist` assets
- Install: published setup executable

**Interfaces:**
- Consumes: verified commits/assets
- Produces: `origin/master`, tag/release `v2.0.11`, installed app `2.0.11`

- [ ] Reviewer checks diff against approved design; fix Critical/Important findings.
- [ ] Re-run full Task 3 verification after review changes.
- [ ] Push branch/commits to `origin/master` without force.
- [ ] Create GitHub release `v2.0.11`; upload setup `.exe`, `.blockmap`, `latest.yml`.
- [ ] Query release; verify tag, published state, and exact three asset names.
- [ ] Stop running Riot Companion Helper normally.
- [ ] Run published installer silently or with supported non-interactive mode; wait for exit code `0`.
- [ ] Start installed Riot Companion Helper.
- [ ] Verify installed executable `ProductVersion` begins `2.0.11`, process runs, config remains present.
- [ ] Verify no `LeagueClient.exe`/`VALORANT.exe`; start Blitz manually and confirm Helper closes it within one polling interval.
