import Store from 'electron-store'

export interface AppSettings {
  blitzPath: string
  valorantTrackerPath: string
  launchWithWindows: boolean
  pollingInterval: number // seconds, 1–10
  monitoringEnabled: boolean
}

const DEFAULTS: AppSettings = {
  blitzPath: '',
  valorantTrackerPath: '',
  launchWithWindows: false,
  pollingInterval: 3,
  monitoringEnabled: true,
}

const store = new Store<AppSettings>({ defaults: DEFAULTS })

export function getSettings(): AppSettings {
  return {
    blitzPath: store.get('blitzPath', DEFAULTS.blitzPath),
    valorantTrackerPath: store.get('valorantTrackerPath', DEFAULTS.valorantTrackerPath),
    launchWithWindows: store.get('launchWithWindows', DEFAULTS.launchWithWindows),
    pollingInterval: store.get('pollingInterval', DEFAULTS.pollingInterval),
    monitoringEnabled: store.get('monitoringEnabled', DEFAULTS.monitoringEnabled),
  }
}

export function saveSettings(s: AppSettings): void {
  store.set('blitzPath', s.blitzPath)
  store.set('valorantTrackerPath', s.valorantTrackerPath)
  store.set('launchWithWindows', s.launchWithWindows)
  store.set('pollingInterval', s.pollingInterval)
  store.set('monitoringEnabled', s.monitoringEnabled)
}
