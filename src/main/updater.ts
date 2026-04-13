import { autoUpdater } from 'electron-updater'
import type { BrowserWindow } from 'electron'

export type UpdateStatus =
  | { status: 'checking' }
  | { status: 'available'; version: string }
  | { status: 'downloading'; version: string; progress: number }
  | { status: 'ready'; version: string }
  | { status: 'not-available' }
  | { status: 'error'; message: string }

export function initUpdater(win: BrowserWindow) {
  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true

  const send = (s: UpdateStatus) => win.webContents.send('update:status', s)

  let pendingVersion = ''

  autoUpdater.on('checking-for-update', () => send({ status: 'checking' }))
  autoUpdater.on('update-available', (info) => {
    pendingVersion = info.version
    send({ status: 'available', version: info.version })
  })
  autoUpdater.on('download-progress', (p) =>
    send({ status: 'downloading', version: pendingVersion, progress: Math.round(p.percent) })
  )
  autoUpdater.on('update-downloaded', (info) => send({ status: 'ready', version: info.version }))
  autoUpdater.on('update-not-available', () => send({ status: 'not-available' }))
  autoUpdater.on('error', (e) => send({ status: 'error', message: e.message }))

  // Check on startup after short delay so the window is ready to receive IPC
  setTimeout(() => autoUpdater.checkForUpdates().catch(() => {}), 3000)
}

export function installUpdate() {
  autoUpdater.quitAndInstall()
}
