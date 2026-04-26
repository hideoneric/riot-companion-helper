import { ipcMain, dialog } from 'electron'
import { getSettings, saveSettings } from './settings-store'
import { listRunningProcesses } from './process-list'
import { setLaunchWithWindows } from './startup'
import type { Poller, PollerState } from './poller'

let currentState: PollerState = {
  leagueRunning: false,
  valorantRunning: false,
  monitoringEnabled: true,
  leagueHelper: {
    running: false,
    processRunning: false,
    pathSet: false,
    processSet: false,
    enabled: true,
    visible: true
  },
  valorantHelper: {
    running: false,
    processRunning: false,
    pathSet: false,
    processSet: false,
    enabled: true,
    visible: true
  }
}

export function setCurrentState(s: PollerState): void {
  currentState = s
}

export function registerIpcHandlers(poller: Poller): void {
  ipcMain.handle('state:get', () => currentState)

  ipcMain.handle('settings:get', () => getSettings())

  ipcMain.handle('settings:save', async (_e, newSettings) => {
    saveSettings(newSettings)
    poller.setLeagueHelper(newSettings.leagueHelper)
    poller.setValorantHelper(newSettings.valorantHelper)
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

  ipcMain.handle('processes:list', () => listRunningProcesses())

  ipcMain.handle('settings:browse', async () => {
    const result = await dialog.showOpenDialog({
      filters: [{ name: 'Executables & Shortcuts', extensions: ['exe', 'lnk'] }],
      properties: ['openFile']
    })
    return result.canceled ? null : result.filePaths[0]
  })
}
