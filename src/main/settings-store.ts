import Store from 'electron-store'

export interface AppSettings {
  blitzPath: string
  launchWithWindows: boolean
  pollingInterval: number // seconds, 1–10
  monitoringEnabled: boolean
  leagueEnabled: boolean
  valorantEnabled: boolean
  porofessorPath: string
  porofessorEnabled: boolean
  blitzVisible: boolean
  porofessorVisible: boolean
  themeColor: string
}

const DEFAULTS: AppSettings = {
  blitzPath: '',
  launchWithWindows: false,
  pollingInterval: 3,
  monitoringEnabled: true,
  leagueEnabled: true,
  valorantEnabled: true,
  porofessorPath: '',
  porofessorEnabled: true,
  blitzVisible: true,
  porofessorVisible: true,
  themeColor: '#7c5cbf',
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
    porofessorPath: store.get('porofessorPath', DEFAULTS.porofessorPath),
    porofessorEnabled: store.get('porofessorEnabled', DEFAULTS.porofessorEnabled),
    blitzVisible: store.get('blitzVisible', DEFAULTS.blitzVisible),
    porofessorVisible: store.get('porofessorVisible', DEFAULTS.porofessorVisible),
    themeColor: store.get('themeColor', DEFAULTS.themeColor),
  }
}

export function saveSettings(s: AppSettings): void {
  store.set('blitzPath', s.blitzPath)
  store.set('launchWithWindows', s.launchWithWindows)
  store.set('pollingInterval', s.pollingInterval)
  store.set('monitoringEnabled', s.monitoringEnabled)
  store.set('leagueEnabled', s.leagueEnabled)
  store.set('valorantEnabled', s.valorantEnabled)
  store.set('porofessorPath', s.porofessorPath)
  store.set('porofessorEnabled', s.porofessorEnabled)
  store.set('blitzVisible', s.blitzVisible)
  store.set('porofessorVisible', s.porofessorVisible)
  store.set('themeColor', s.themeColor)
}
