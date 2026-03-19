import { app, BrowserWindow, ipcMain } from 'electron'
import * as path from 'path'
import { is } from '@electron-toolkit/utils'
import { getSettings, saveSettings } from './settings-store'
import { detectBlitzPath } from './detector'
import { BlitzLauncher } from './launcher'
import { Poller } from './poller'
import { createTray } from './tray'
import { registerIpcHandlers, setCurrentState } from './ipc-handlers'

// Enforce single instance
if (!app.requestSingleInstanceLock()) app.quit()

let mainWindow: BrowserWindow | null = null
let settingsWindow: BrowserWindow | null = null
const launcher = new BlitzLauncher()
const logEntries: unknown[] = []

function createMainWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 400,
    height: 500,
    resizable: true,
    frame: false,
    backgroundColor: '#0f0e17',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(path.join(__dirname, '../renderer/renderer/index.html'))
  }

  win.on('close', (e) => {
    e.preventDefault()
    win.hide()
  })

  return win
}

function createSettingsWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 350,
    height: 270,
    resizable: false,
    parent: mainWindow ?? undefined,
    modal: false,
    frame: false,
    backgroundColor: '#0f0e17',
    webPreferences: {
      preload: path.join(__dirname, '../preload/settings.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    const devUrl = process.env['ELECTRON_RENDERER_URL']
    // With root='src/', settings is at /settings/index.html on the dev server
    const base = devUrl.replace(/\/renderer\/index\.html$/, '').replace(/\/$/, '')
    win.loadURL(`${base}/settings/index.html`)
      .catch(() => win.loadFile(path.join(__dirname, '../renderer/settings/index.html')))
  } else {
    win.loadFile(path.join(__dirname, '../renderer/settings/index.html'))
  }

  win.on('closed', () => { settingsWindow = null })

  return win
}

app.whenReady().then(() => {
  app.setAppUserModelId('com.riotcompanionhelper.app')

  const settings = getSettings()

  // Auto-detect Blitz path if not set
  if (!settings.blitzPath) {
    const detected = detectBlitzPath()
    if (detected) {
      saveSettings({ ...settings, blitzPath: detected })
    }
  }

  mainWindow = createMainWindow()

  // Declare tray early so the Poller closure can reference it safely
  let tray: import('electron').Tray | null = null

  const poller = new Poller({
    launcher,
    onLog: (entry) => {
      logEntries.unshift(entry)
      if (logEntries.length > 100) logEntries.pop()
      mainWindow?.webContents.send('log:entry', entry)
    },
    onStateChange: (state) => {
      setCurrentState(state)
      mainWindow?.webContents.send('state:update', state)
    },
    onTrayNotify: (title, message) => {
      tray?.displayBalloon({ title, content: message, iconType: 'warning' })
    },
  })

  const currentSettings = getSettings()
  poller.setBlitzPath(currentSettings.blitzPath)

  if (currentSettings.monitoringEnabled && currentSettings.blitzPath) {
    poller.startInterval(currentSettings.pollingInterval)
  }

  // Open settings automatically if no Blitz path found
  if (!currentSettings.blitzPath) {
    mainWindow.once('show', () => {
      setTimeout(() => {
        if (!settingsWindow) {
          settingsWindow = createSettingsWindow()
        }
      }, 500)
    })
  }

  tray = createTray(
    path.join(__dirname, '../../resources/icon.ico'),
    () => { mainWindow?.show(); mainWindow?.focus() },
    () => {
      const s = getSettings()
      const enabled = !s.monitoringEnabled
      saveSettings({ ...s, monitoringEnabled: enabled })
      poller.setMonitoring(enabled)
    },
    () => getSettings().monitoringEnabled,
  )

  registerIpcHandlers(poller)

  // Window control IPC
  ipcMain.on('window:minimize', () => mainWindow?.minimize())
  ipcMain.on('window:hide', () => mainWindow?.hide())

  // Settings window: open or focus
  ipcMain.on('settings:open', () => {
    if (settingsWindow) {
      settingsWindow.focus()
    } else {
      settingsWindow = createSettingsWindow()
    }
  })

  app.on('second-instance', () => {
    mainWindow?.show()
    mainWindow?.focus()
  })

  app.on('before-quit', () => {
    if (launcher.launchedPid) launcher.kill()
  })

  app.on('window-all-closed', (e: Event) => e.preventDefault())
})
