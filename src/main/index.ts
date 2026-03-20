import { app, BrowserWindow, ipcMain } from 'electron'
import * as path from 'path'
import { is } from '@electron-toolkit/utils'
import { getSettings, saveSettings } from './settings-store'
import { detectBlitzPath } from './detector'
import { BlitzLauncher } from './launcher'
import { Poller } from './poller'
import { createTray } from './tray'
import { registerIpcHandlers, setCurrentState } from './ipc-handlers'

app.setName('Riot Companion Helper')
let isQuitting = false

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
    show: false,
    frame: false,
    backgroundColor: '#0f0e17',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  win.on('ready-to-show', () => {
    win.show()
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(path.join(__dirname, '../renderer/renderer/index.html'))
  }

  win.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault()
      win.hide()
    }
  })

  return win
}

function createSettingsWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 350,
    height: 270,
    resizable: false,
    show: false,
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

  win.on('ready-to-show', () => {
    win.show()
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    const devUrl = process.env['ELECTRON_RENDERER_URL']
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

  // Load and (if needed) auto-detect settings before anything else
  let settings = getSettings()
  if (!settings.blitzPath) {
    const detected = detectBlitzPath()
    if (detected) {
      saveSettings({ ...settings, blitzPath: detected })
      settings = getSettings()
    }
  }

  const launcher_ = launcher
  const poller = new Poller({
    launcher: launcher_,
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

  // Seed initial state from persisted settings so state:get is correct immediately
  setCurrentState({
    leagueRunning: false,
    blitzRunning: false,
    monitoringEnabled: settings.monitoringEnabled,
    blitzPathSet: !!settings.blitzPath,
  })

  // Register IPC handlers BEFORE creating windows to avoid any race
  registerIpcHandlers(poller)
  ipcMain.on('window:minimize', () => mainWindow?.minimize())
  ipcMain.on('window:hide', () => mainWindow?.hide())
  ipcMain.on('settings:open', () => {
    if (settingsWindow) {
      settingsWindow.focus()
    } else {
      settingsWindow = createSettingsWindow()
    }
  })

  poller.setBlitzPath(settings.blitzPath)
  if (settings.monitoringEnabled && settings.blitzPath) {
    poller.startInterval(settings.pollingInterval)
  }

  // Create windows after IPC is ready
  mainWindow = createMainWindow()

  // Declare tray variable so Poller closure can reference it
  let tray: import('electron').Tray | null = null

  // Auto-open settings if no Blitz path
  if (!settings.blitzPath) {
    mainWindow.once('show', () => {
      setTimeout(() => {
        if (!settingsWindow) {
          settingsWindow = createSettingsWindow()
        }
      }, 300)
    })
  }

  const iconPath = is.dev
    ? path.join(__dirname, '../../resources/icon.ico')
    : path.join(process.resourcesPath, 'icon.ico')

  tray = createTray(
    iconPath,
    () => { mainWindow?.show(); mainWindow?.focus() },
    () => {
      const s = getSettings()
      const enabled = !s.monitoringEnabled
      saveSettings({ ...s, monitoringEnabled: enabled })
      poller.setMonitoring(enabled)
    },
    () => getSettings().monitoringEnabled,
  )

  app.on('second-instance', () => {
    mainWindow?.show()
    mainWindow?.focus()
  })

  app.on('before-quit', () => {
    isQuitting = true
    if (launcher.launchedPid) launcher.kill()
  })

  app.on('window-all-closed', (e: Event) => e.preventDefault())
})
