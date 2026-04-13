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
const launcher = new BlitzLauncher()
const porofessorLauncher = new BlitzLauncher()
const logEntries: unknown[] = []

function createMainWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 860,
    height: 580,
    minWidth: 760,
    minHeight: 520,
    resizable: true,
    show: false,
    frame: false,
    backgroundColor: '#111114',
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

  const poller = new Poller({
    launcher,
    porofessorLauncher,
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
    valorantRunning: false,
    monitoringEnabled: settings.monitoringEnabled,
    blitzPathSet: !!settings.blitzPath,
    leagueEnabled: settings.leagueEnabled,
    valorantEnabled: settings.valorantEnabled,
    porofessorRunning: false,
    porofessorPathSet: !!settings.porofessorPath,
  })

  // Register IPC handlers BEFORE creating windows to avoid any race
  registerIpcHandlers(poller)
  ipcMain.on('window:minimize', () => mainWindow?.minimize())
  ipcMain.on('window:hide', () => mainWindow?.hide())
  // settings:open navigates the renderer to the settings page instead of opening a new window
  ipcMain.on('settings:open', () => mainWindow?.webContents.send('navigate', 'settings'))

  poller.setBlitzPath(settings.blitzPath)
  poller.setPorofessorPath(settings.porofessorPath)
  poller.setPorofessorEnabled(settings.porofessorEnabled)
  poller.setLeagueEnabled(settings.leagueEnabled)
  poller.setValorantEnabled(settings.valorantEnabled)
  if (settings.monitoringEnabled && (settings.blitzPath || settings.porofessorPath)) {
    poller.startInterval(settings.pollingInterval)
  }

  // Create window after IPC is ready
  mainWindow = createMainWindow()

  let tray: import('electron').Tray | null = null

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
    if (porofessorLauncher.launchedPid) porofessorLauncher.kill()
  })

  app.on('window-all-closed', (e: Event) => e.preventDefault())
})
