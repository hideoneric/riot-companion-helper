import Store from 'electron-store'

export interface AppSettings {
  blitzPath: string
  blitzName: string
  launchWithWindows: boolean
  pollingInterval: number // seconds, 1–10
  monitoringEnabled: boolean
  leagueEnabled: boolean
  valorantEnabled: boolean
  blitzEnabled: boolean
  porofessorPath: string
  porofessorName: string
  porofessorEnabled: boolean
  blitzVisible: boolean
  porofessorVisible: boolean
  themeColor: string
}

const DEFAULTS: AppSettings = {
  blitzPath: '',
  blitzName: '',
  launchWithWindows: false,
  pollingInterval: 3,
  monitoringEnabled: true,
  leagueEnabled: true,
  valorantEnabled: true,
  blitzEnabled: true,
  porofessorPath: '',
  porofessorName: '',
  porofessorEnabled: true,
  blitzVisible: true,
  porofessorVisible: true,
  themeColor: '#ff4058'
}

const store = new Store<AppSettings>({ defaults: DEFAULTS })

export function getSettings(): AppSettings {
  return {
    blitzPath: store.get('blitzPath', DEFAULTS.blitzPath),
    blitzName: store.get('blitzName', DEFAULTS.blitzName),
    launchWithWindows: store.get('launchWithWindows', DEFAULTS.launchWithWindows),
    pollingInterval: store.get('pollingInterval', DEFAULTS.pollingInterval),
    monitoringEnabled: store.get('monitoringEnabled', DEFAULTS.monitoringEnabled),
    leagueEnabled: store.get('leagueEnabled', DEFAULTS.leagueEnabled),
    valorantEnabled: store.get('valorantEnabled', DEFAULTS.valorantEnabled),
    blitzEnabled: store.get('blitzEnabled', DEFAULTS.blitzEnabled),
    porofessorPath: store.get('porofessorPath', DEFAULTS.porofessorPath),
    porofessorName: store.get('porofessorName', DEFAULTS.porofessorName),
    porofessorEnabled: store.get('porofessorEnabled', DEFAULTS.porofessorEnabled),
    blitzVisible: store.get('blitzVisible', DEFAULTS.blitzVisible),
    porofessorVisible: store.get('porofessorVisible', DEFAULTS.porofessorVisible),
    themeColor: store.get('themeColor', DEFAULTS.themeColor)
  }
}

export function saveSettings(s: AppSettings): void {
  store.set('blitzPath', s.blitzPath)
  store.set('blitzName', s.blitzName)
  store.set('launchWithWindows', s.launchWithWindows)
  store.set('pollingInterval', s.pollingInterval)
  store.set('monitoringEnabled', s.monitoringEnabled)
  store.set('leagueEnabled', s.leagueEnabled)
  store.set('valorantEnabled', s.valorantEnabled)
  store.set('blitzEnabled', s.blitzEnabled)
  store.set('porofessorPath', s.porofessorPath)
  store.set('porofessorName', s.porofessorName)
  store.set('porofessorEnabled', s.porofessorEnabled)
  store.set('blitzVisible', s.blitzVisible)
  store.set('porofessorVisible', s.porofessorVisible)
  store.set('themeColor', s.themeColor)
}
