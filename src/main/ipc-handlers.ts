import { ipcMain, dialog } from 'electron'
import { getSettings, saveSettings } from './settings-store'
import { setLaunchWithWindows } from './startup'
import { detectOverwolfPath } from './detector'
import type { Poller } from './poller'

let currentState = {
  leagueRunning: false,
  blitzRunning: false,
  valorantRunning: false,
  valorantTrackerRunning: false,
  monitoringEnabled: true,
  blitzPathSet: false,
  valorantTrackerPathSet: false,
}

export function setCurrentState(s: typeof currentState) {
  currentState = s
}

export function registerIpcHandlers(poller: Poller) {
  ipcMain.handle('state:get', () => currentState)

  // Note: 'settings:open' is handled directly in index.ts where the settings
  // window reference lives — do NOT register it here to avoid double-handling.

  ipcMain.handle('settings:get', () => getSettings())

  ipcMain.handle('settings:save', async (_e, newSettings) => {
    saveSettings(newSettings)
    poller.setBlitzPath(newSettings.blitzPath)
    poller.setValorantTrackerPath(newSettings.valorantTrackerPath)
    if (newSettings.monitoringEnabled !== currentState.monitoringEnabled) {
      poller.setMonitoring(newSettings.monitoringEnabled)
    }
    poller.startInterval(newSettings.pollingInterval)
    try {
      setLaunchWithWindows(newSettings.launchWithWindows)
    } catch {
      // Registry access may fail if not running as admin; non-critical
    }
  })

  ipcMain.handle('settings:browse', async () => {
    const result = await dialog.showOpenDialog({
      filters: [{ name: 'Executables', extensions: ['exe'] }],
      properties: ['openFile'],
    })
    return result.canceled ? null : result.filePaths[0]
  })

  ipcMain.handle('settings:detectOverwolf', () => detectOverwolfPath())
}
