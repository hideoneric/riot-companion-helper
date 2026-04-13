import { ipcMain, dialog } from 'electron'
import { getSettings, saveSettings } from './settings-store'
import { setLaunchWithWindows } from './startup'
import type { Poller } from './poller'

let currentState = {
  leagueRunning: false,
  blitzRunning: false,
  valorantRunning: false,
  monitoringEnabled: true,
  blitzPathSet: false,
  leagueEnabled: true,
  valorantEnabled: true,
  blitzEnabled: true,
  porofessorRunning: false,
  porofessorPathSet: false,
  porofessorEnabled: true,
}

export function setCurrentState(s: typeof currentState) {
  currentState = s
}

export function registerIpcHandlers(poller: Poller) {
  ipcMain.handle('state:get', () => currentState)

  ipcMain.handle('settings:get', () => getSettings())

  ipcMain.handle('settings:save', async (_e, newSettings) => {
    saveSettings(newSettings)
    poller.setBlitzPath(newSettings.blitzPath)
    poller.setBlitzEnabled(newSettings.blitzEnabled)
    poller.setPorofessorPath(newSettings.porofessorPath)
    poller.setPorofessorEnabled(newSettings.porofessorEnabled)
    poller.setLeagueEnabled(newSettings.leagueEnabled)
    poller.setValorantEnabled(newSettings.valorantEnabled)
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
      filters: [{ name: 'Executables & Shortcuts', extensions: ['exe', 'lnk'] }],
      properties: ['openFile'],
    })
    return result.canceled ? null : result.filePaths[0]
  })
}
