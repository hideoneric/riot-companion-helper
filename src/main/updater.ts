import { autoUpdater } from 'electron-updater'
import type { BrowserWindow } from 'electron'

export type UpdateStatus =
  | { status: 'checking' }
  | { status: 'available'; version: string }
  | { status: 'downloading'; version: string; progress: number }
  | { status: 'ready'; version: string }
  | { status: 'not-available' }
  | { status: 'error'; message: string }

let checkInProgress = false
let installScheduled = false
let initialized = false

export function initUpdater(win: BrowserWindow) {
  if (initialized) return
  initialized = true

  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true

  const send = (s: UpdateStatus) => win.webContents.send('update:status', s)

  let pendingVersion = ''

  autoUpdater.on('checking-for-update', () => {
    checkInProgress = true
    send({ status: 'checking' })
  })
  autoUpdater.on('update-available', (info) => {
    pendingVersion = info.version
    send({ status: 'available', version: info.version })
  })
  autoUpdater.on('download-progress', (p) =>
    send({ status: 'downloading', version: pendingVersion, progress: Math.round(p.percent) })
  )
  autoUpdater.on('update-downloaded', (info) => {
    checkInProgress = false
    send({ status: 'ready', version: info.version })
    scheduleInstall()
  })
  autoUpdater.on('update-not-available', () => {
    checkInProgress = false
    send({ status: 'not-available' })
  })
  autoUpdater.on('error', (e) => {
    checkInProgress = false
    send({ status: 'error', message: e.message })
  })

  // Check on startup after short delay so the window is ready to receive IPC
  setTimeout(() => {
    void checkForUpdates().catch(() => {})
  }, 3000)
}

export function checkForUpdates() {
  if (checkInProgress) return Promise.resolve(null)

  checkInProgress = true
  return autoUpdater.checkForUpdates().catch((error) => {
    checkInProgress = false
    throw error
  })
}

export function installUpdate() {
  scheduleInstall(0)
}

function scheduleInstall(delayMs = 1800): void {
  if (installScheduled) return
  installScheduled = true

  setTimeout(() => {
    autoUpdater.quitAndInstall(false, true)
  }, delayMs)
}
