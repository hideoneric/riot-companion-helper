import Store from 'electron-store'

export interface HelperSlotSettings {
  appPath: string
  processName: string
  enabled: boolean
  visible: boolean
}

export interface AppSettings {
  launchWithWindows: boolean
  pollingInterval: number // seconds, 1-10
  monitoringEnabled: boolean
  leagueHelper: HelperSlotSettings
  valorantHelper: HelperSlotSettings
  themeColor: string
}

const DEFAULT_HELPER: HelperSlotSettings = {
  appPath: '',
  processName: '',
  enabled: true,
  visible: true
}

const DEFAULTS: AppSettings = {
  launchWithWindows: false,
  pollingInterval: 3,
  monitoringEnabled: true,
  leagueHelper: DEFAULT_HELPER,
  valorantHelper: DEFAULT_HELPER,
  themeColor: '#7c5cbf'
}

const store = new Store<AppSettings>({ defaults: DEFAULTS })

function normalizePollingInterval(value: unknown): number {
  return [1, 2, 3, 5, 10].includes(value as number) ? (value as number) : DEFAULTS.pollingInterval
}

function normalizeThemeColor(value: unknown): string {
  return typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value) ? value : DEFAULTS.themeColor
}

function normalizeHelper(value: unknown): HelperSlotSettings {
  if (!value || typeof value !== 'object') return { ...DEFAULT_HELPER }
  const helper = value as Partial<HelperSlotSettings>

  return {
    appPath: typeof helper.appPath === 'string' ? helper.appPath : DEFAULT_HELPER.appPath,
    processName:
      typeof helper.processName === 'string' ? helper.processName : DEFAULT_HELPER.processName,
    enabled: typeof helper.enabled === 'boolean' ? helper.enabled : DEFAULT_HELPER.enabled,
    visible: typeof helper.visible === 'boolean' ? helper.visible : DEFAULT_HELPER.visible
  }
}

export function getSettings(): AppSettings {
  return {
    launchWithWindows: store.get('launchWithWindows', DEFAULTS.launchWithWindows),
    pollingInterval: normalizePollingInterval(
      store.get('pollingInterval', DEFAULTS.pollingInterval)
    ),
    monitoringEnabled: store.get('monitoringEnabled', DEFAULTS.monitoringEnabled),
    leagueHelper: normalizeHelper(store.get('leagueHelper', DEFAULTS.leagueHelper)),
    valorantHelper: normalizeHelper(store.get('valorantHelper', DEFAULTS.valorantHelper)),
    themeColor: normalizeThemeColor(store.get('themeColor', DEFAULTS.themeColor))
  }
}

export function saveSettings(s: AppSettings): void {
  store.set('launchWithWindows', s.launchWithWindows)
  store.set('pollingInterval', s.pollingInterval)
  store.set('monitoringEnabled', s.monitoringEnabled)
  store.set('leagueHelper', s.leagueHelper)
  store.set('valorantHelper', s.valorantHelper)
  store.set('themeColor', s.themeColor)
}
