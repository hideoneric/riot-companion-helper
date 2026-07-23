import { app, BrowserWindow, ipcMain } from 'electron'
import * as path from 'path'
import { is } from '@electron-toolkit/utils'
import { getSettings, saveSettings } from './settings-store'
import { detectBlitzPath } from './detector'
import { BlitzLauncher } from './launcher'
import { Poller } from './poller'
import { createTray } from './tray'
import { registerIpcHandlers, setCurrentState } from './ipc-handlers'
import { checkForUpdates, initUpdater, installUpdate } from './updater'
import { presentWindowOnReady } from './window-startup'
import { PowerShellProcessDetector } from './process-detector'

app.setName('Riot Companion Helper')
let isQuitting = false

// Enforce single instance
if (!app.requestSingleInstanceLock()) app.quit()

let mainWindow: BrowserWindow | null = null
const launcher = new BlitzLauncher()
const porofessorLauncher = new BlitzLauncher()
const processDetector = new PowerShellProcessDetector()
const logEntries: unknown[] = []

function createMainWindow(startMinimized: boolean): BrowserWindow {
  const win = new BrowserWindow({
    width: 860,
    height: 560,
    minWidth: 840,
    minHeight: 540,
    resizable: true,
    show: false,
    frame: false,
    backgroundColor: '#0f1011',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  win.on('ready-to-show', () => {
    presentWindowOnReady(win, startMinimized)
    if (!is.dev) initUpdater(win)
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
    processDetector,
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
    }
  })

  // Seed initial state from persisted settings so state:get is correct immediately
  setCurrentState({
    leagueRunning: false,
    blitzRunning: false,
    valorantRunning: false,
    monitoringEnabled: settings.monitoringEnabled,
    blitzPathSet: !!settings.helpers[0]?.path,
    leagueEnabled: settings.leagueEnabled,
    valorantEnabled: settings.valorantEnabled,
    blitzEnabled: settings.helpers[0]?.enabled ?? false,
    porofessorRunning: false,
    porofessorPathSet: !!settings.helpers[1]?.path,
    porofessorEnabled: settings.helpers[1]?.enabled ?? false
  })

  // Register IPC handlers BEFORE creating windows to avoid any race
  registerIpcHandlers(poller, processDetector)
  ipcMain.on('window:minimize', () => mainWindow?.minimize())
  ipcMain.on('window:hide', () => mainWindow?.hide())
  // settings:open navigates the renderer to the settings page instead of opening a new window
  ipcMain.on('settings:open', () => mainWindow?.webContents.send('navigate', 'settings'))
  ipcMain.on('update:install', () => installUpdate())
  ipcMain.handle('update:check', () => {
    if (is.dev) {
      mainWindow?.webContents.send('update:status', { status: 'not-available' })
      return Promise.resolve()
    }
    return checkForUpdates().catch((error) => {
      mainWindow?.webContents.send('update:status', {
        status: 'error',
        message: (error as Error).message
      })
    })
  })

  poller.setBlitzPath(settings.helpers[0]?.path ?? '')
  poller.setBlitzProcessName(settings.helpers[0]?.processName ?? '')
  poller.setBlitzEnabled(settings.helpers[0]?.enabled ?? false)
  poller.setBlitzGameBindings(settings.helpers[0]?.gameBindings ?? { league: true, valorant: true })
  poller.setPorofessorPath(settings.helpers[1]?.path ?? '')
  poller.setPorofessorProcessName(settings.helpers[1]?.processName ?? '')
  poller.setPorofessorEnabled(settings.helpers[1]?.enabled ?? false)
  poller.setPorofessorGameBindings(
    settings.helpers[1]?.gameBindings ?? { league: true, valorant: false }
  )
  poller.setLeagueEnabled(settings.leagueEnabled)
  poller.setValorantEnabled(settings.valorantEnabled)
  if (settings.monitoringEnabled && settings.helpers.some((helper) => helper.path)) {
    poller.startInterval(settings.pollingInterval)
  }

  // Create window after IPC is ready
  mainWindow = createMainWindow(settings.startMinimized)

  let tray: import('electron').Tray | null = null

  const iconPath = is.dev
    ? path.join(__dirname, '../../resources/icon.ico')
    : path.join(process.resourcesPath, 'icon.ico')

  tray = createTray(
    iconPath,
    () => {
      mainWindow?.show()
      mainWindow?.focus()
    },
    () => {
      const s = getSettings()
      const enabled = !s.monitoringEnabled
      saveSettings({ ...s, monitoringEnabled: enabled })
      poller.setMonitoring(enabled)
      if (enabled && s.helpers.some((helper) => helper.path)) {
        poller.startInterval(s.pollingInterval)
      }
    },
    () => getSettings().monitoringEnabled
  )

  app.on('second-instance', () => {
    mainWindow?.show()
    mainWindow?.focus()
  })

  app.on('before-quit', () => {
    isQuitting = true
    if (launcher.launchedPid) void launcher.kill()
    if (porofessorLauncher.launchedPid) void porofessorLauncher.kill()
  })

  app.on('window-all-closed', () => {
    // Keep the tray app alive until the user explicitly quits.
  })
})
