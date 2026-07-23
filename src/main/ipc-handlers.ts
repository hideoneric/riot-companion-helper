import { ipcMain, dialog } from 'electron'
import { getSettings, saveSettings } from './settings-store'
import type { AppSettings } from './settings-store'
import { setLaunchWithWindows } from './startup'
import type { Poller } from './poller'
import type { ProcessDetector } from './process-detector'

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
  porofessorEnabled: true
}

export function setCurrentState(s: typeof currentState) {
  currentState = s
}

export interface ProcessOption {
  name: string
}

export async function listProcessOptions(detector: ProcessDetector): Promise<ProcessOption[]> {
  return [...(await detector.snapshot())].sort().map((name) => ({ name }))
}

export function registerIpcHandlers(poller: Poller, detector: ProcessDetector) {
  ipcMain.handle('state:get', () => currentState)

  ipcMain.handle('settings:get', () => getSettings())

  ipcMain.handle('settings:save', async (_e, newSettings) => {
    const previousSettings = getSettings()
    const monitoringChanged = newSettings.monitoringEnabled !== currentState.monitoringEnabled
    const pollingUpdate = getPollingUpdate(
      previousSettings,
      newSettings,
      currentState.monitoringEnabled
    )
    const shouldRefreshState = shouldRefreshPollingState(previousSettings, newSettings)

    saveSettings(newSettings)
    const [primaryHelper, secondaryHelper] = newSettings.helpers

    poller.setBlitzPath(primaryHelper?.path ?? '')
    poller.setBlitzProcessName(primaryHelper?.processName ?? '')
    poller.setBlitzEnabled(primaryHelper?.enabled ?? false)
    poller.setBlitzGameBindings(primaryHelper?.gameBindings ?? { league: true, valorant: true })
    poller.setPorofessorPath(secondaryHelper?.path ?? '')
    poller.setPorofessorProcessName(secondaryHelper?.processName ?? '')
    poller.setPorofessorEnabled(secondaryHelper?.enabled ?? false)
    poller.setPorofessorGameBindings(
      secondaryHelper?.gameBindings ?? { league: true, valorant: false }
    )
    poller.setLeagueEnabled(newSettings.leagueEnabled)
    poller.setValorantEnabled(newSettings.valorantEnabled)
    if (monitoringChanged) {
      poller.setMonitoring(newSettings.monitoringEnabled)
    }
    if (pollingUpdate === 'start') {
      poller.startInterval(newSettings.pollingInterval)
    } else if (pollingUpdate === 'stop') {
      poller.stopInterval()
    } else if (
      shouldRefreshState &&
      newSettings.monitoringEnabled &&
      newSettings.helpers.some((helper) => helper.path)
    ) {
      void poller.tick()
    }
    try {
      setLaunchWithWindows(newSettings.launchWithWindows)
    } catch (error) {
      console.error('Failed to update Windows startup registration:', error)
    }
  })

  ipcMain.handle('settings:browse', async () => {
    const result = await dialog.showOpenDialog({
      filters: [{ name: 'Executables & Shortcuts', extensions: ['exe', 'lnk'] }],
      properties: ['openFile']
    })
    return result.canceled ? null : result.filePaths[0]
  })

  ipcMain.handle('processes:list', () => listProcessOptions(detector))
}

export function getPollingUpdate(
  previousSettings: AppSettings,
  nextSettings: AppSettings,
  currentMonitoringEnabled: boolean
): 'start' | 'stop' | 'none' {
  const hadHelperPath = previousSettings.helpers.some((helper) => helper.path)
  const hasHelperPath = nextSettings.helpers.some((helper) => helper.path)

  if (!nextSettings.monitoringEnabled || !hasHelperPath) return 'stop'
  if (!currentMonitoringEnabled) return 'start'
  if (previousSettings.pollingInterval !== nextSettings.pollingInterval) return 'start'
  if (hadHelperPath !== hasHelperPath) return 'start'

  return 'none'
}

export function shouldRefreshPollingState(
  previousSettings: AppSettings,
  nextSettings: AppSettings
): boolean {
  if (previousSettings.leagueEnabled !== nextSettings.leagueEnabled) return true
  if (previousSettings.valorantEnabled !== nextSettings.valorantEnabled) return true

  return nextSettings.helpers.some((nextHelper) => {
    const previousHelper = previousSettings.helpers.find((helper) => helper.id === nextHelper.id)
    if (!previousHelper) return true

    return (
      previousHelper.path !== nextHelper.path ||
      previousHelper.processName !== nextHelper.processName ||
      previousHelper.enabled !== nextHelper.enabled ||
      previousHelper.gameBindings.league !== nextHelper.gameBindings.league ||
      previousHelper.gameBindings.valorant !== nextHelper.gameBindings.valorant
    )
  })
}
