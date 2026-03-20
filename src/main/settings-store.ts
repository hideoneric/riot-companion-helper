import Store from 'electron-store'

export interface AppSettings {
  blitzPath: string
  launchWithWindows: boolean
  pollingInterval: number // seconds, 1–10
  monitoringEnabled: boolean
  leagueEnabled: boolean
  valorantEnabled: boolean
}

const DEFAULTS: AppSettings = {
  blitzPath: '',
  launchWithWindows: false,
  pollingInterval: 3,
  monitoringEnabled: true,
  leagueEnabled: true,
  valorantEnabled: true,
}

const store = new Store<AppSettings>({ defaults: DEFAULTS })

export function getSettings(): AppSettings {
  return {
    blitzPath: store.get('blitzPath', DEFAULTS.blitzPath),
    launchWithWindows: store.get('launchWithWindows', DEFAULTS.launchWithWindows),
    pollingInterval: store.get('pollingInterval', DEFAULTS.pollingInterval),
    monitoringEnabled: store.get('monitoringEnabled', DEFAULTS.monitoringEnabled),
    leagueEnabled: store.get('leagueEnabled', DEFAULTS.leagueEnabled),
    valorantEnabled: store.get('valorantEnabled', DEFAULTS.valorantEnabled),
  }
}

export function saveSettings(s: AppSettings): void {
  store.set('blitzPath', s.blitzPath)
  store.set('launchWithWindows', s.launchWithWindows)
  store.set('pollingInterval', s.pollingInterval)
  store.set('monitoringEnabled', s.monitoringEnabled)
  store.set('leagueEnabled', s.leagueEnabled)
  store.set('valorantEnabled', s.valorantEnabled)
}
