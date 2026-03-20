# Riot Companion Helper

> Automatically launch and close Blitz.gg when League of Legends or Valorant starts.

[![Version](https://img.shields.io/github/v/release/hideoneric/riot-companion-helper?label=version&color=7c5cbf)](https://github.com/hideoneric/riot-companion-helper/releases/latest)
[![Platform](https://img.shields.io/badge/platform-Windows%2010%2F11-blue)](https://github.com/hideoneric/riot-companion-helper/releases/latest)
[![License](https://img.shields.io/github/license/hideoneric/riot-companion-helper?color=555)](LICENSE)

Riot Companion Helper is a lightweight Windows system tray app that watches for League of Legends and Valorant — and launches [Blitz.gg](https://blitz.gg) automatically when either game starts. When all games close, Blitz closes too.

**[Website](https://hideoneric.github.io/riot-companion-helper/) · [Download](https://github.com/hideoneric/riot-companion-helper/releases/latest) · [Releases](https://github.com/hideoneric/riot-companion-helper/releases)**

---

## Features

- **Auto-launch** — Blitz.gg opens the moment League of Legends or Valorant is detected
- **Smart close** — Blitz stays open while any game is running; closes only when all games stop
- **System tray** — runs silently in the background, out of your way
- **Configurable polling** — adjustable detection interval (default 5 s)
- **Launch with Windows** — optional startup entry so it's always ready
- **Supports `.lnk` shortcuts** — point to a shortcut instead of the raw `.exe`
- **No admin rights required** — per-user install, no UAC prompts

---

## How it works

```
LeagueClient.exe  ─┐
                   ├─ detected? → launch Blitz.gg
VALORANT.exe      ─┘

both closed?      → close Blitz.gg
```

The app polls the Windows process list every N seconds. When the first game process appears it launches Blitz (if not already running). When the last game process disappears it kills Blitz.

---

## Installation

1. Download the latest installer from [Releases](https://github.com/hideoneric/riot-companion-helper/releases/latest)
2. Run `riot-companion-helper-x.x.x-setup.exe` — no admin rights needed
3. Open the app, go to **Settings → General**, and point it at `Blitz.exe`
4. Enable **Launch with Windows** if you want it to start automatically

> **Windows Developer Mode** is not required for end users — only for contributors packaging a new build.

---

## Settings

| Setting | Description | Default |
|---|---|---|
| Blitz path | Path to `Blitz.exe` or a `.lnk` shortcut | — |
| Polling interval | How often to check for game processes (seconds) | 5 s |
| Monitoring enabled | Toggle all detection on/off | On |
| Launch with Windows | Add to Windows startup registry | Off |

---

## Development

### Requirements

- Node.js 20+
- npm 9+
- Windows (the app uses `tasklist` — Mac/Linux builds are not functional)

### Setup

```bash
git clone https://github.com/hideoneric/riot-companion-helper.git
cd riot-companion-helper
npm install
```

### Commands

```bash
npm run dev        # Start with hot-reload (renderer + main)
npm run build      # Compile all three targets (main, preload, renderer)
npm run package    # Build + produce installer in dist/
npm run lint       # ESLint check
```

> **Packaging** requires [Windows Developer Mode](ms-settings:developers) enabled (Settings → System → For developers) to avoid symlink errors from electron-builder.

### Architecture

Three compiled targets managed by [electron-vite](https://electron-vite.org):

```
src/main/       → Node.js main process
src/preload/    → Context bridge (IPC surface)
src/renderer/   → React + TypeScript UI
```

| File | Role |
|---|---|
| `src/main/index.ts` | App entry — window, tray, single-instance lock |
| `src/main/poller.ts` | Process detection loop, Blitz launch/kill logic |
| `src/main/launcher.ts` | `BlitzLauncher` — spawn/kill with `.lnk` support |
| `src/main/ipc-handlers.ts` | All `ipcMain` registrations, shared app state |
| `src/main/settings-store.ts` | Persistent settings via `electron-store` v8 |
| `src/main/detector.ts` | Auto-detect Blitz.exe path on disk |
| `src/main/tray.ts` | System tray icon and context menu |
| `src/main/startup.ts` | Windows registry launch-with-Windows entry |

### Creating a release

```bash
npm run package
"/c/Program Files/GitHub CLI/gh.exe" release create vX.Y.Z \
  "dist/riot-companion-helper-X.Y.Z-setup.exe" \
  --title "vX.Y.Z - ..." \
  --notes "..."
```

---

## Tech stack

- [Electron](https://www.electronjs.org/) v39
- [React](https://react.dev/) v19
- [TypeScript](https://www.typescriptlang.org/) v5
- [electron-vite](https://electron-vite.org/) — build tooling
- [electron-store](https://github.com/sindresorhus/electron-store) v8 — settings persistence
- [electron-builder](https://www.electron.build/) — Windows NSIS installer

---

## License

MIT
