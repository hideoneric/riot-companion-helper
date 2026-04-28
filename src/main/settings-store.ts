import Store from 'electron-store'

export interface HelperConfig {
  id: string
  path: string
  displayName: string
  detectedName: string
  enabled: boolean
  gameBindings: {
    league: boolean
    valorant: boolean
  }
  showOnOverview: boolean
}

export interface AppSettings {
  blitzPath: string
  blitzName: string
  launchWithWindows: boolean
  pollingInterval: number // seconds, 1-10
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
  helpers: HelperConfig[]
}

const DEFAULT_HELPERS: HelperConfig[] = [
  {
    id: 'helper-1',
    path: '',
    displayName: '',
    detectedName: '',
    enabled: false,
    gameBindings: { league: true, valorant: true },
    showOnOverview: true
  },
  {
    id: 'helper-2',
    path: '',
    displayName: '',
    detectedName: '',
    enabled: false,
    gameBindings: { league: true, valorant: false },
    showOnOverview: true
  }
]

const DEFAULTS: AppSettings = {
  blitzPath: '',
  blitzName: '',
  launchWithWindows: false,
  pollingInterval: 3,
  monitoringEnabled: true,
  leagueEnabled: true,
  valorantEnabled: true,
  blitzEnabled: false,
  porofessorPath: '',
  porofessorName: '',
  porofessorEnabled: false,
  blitzVisible: true,
  porofessorVisible: true,
  themeColor: '#d9e6ff',
  helpers: DEFAULT_HELPERS
}

const store = new Store<AppSettings>({ defaults: DEFAULTS })

export function getSettings(): AppSettings {
  const storedHelpers = (
    store as unknown as {
      get: (key: string, defaultValue: HelperConfig[] | null) => HelperConfig[] | null
    }
  ).get('helpers', null)
  const helpers = normalizeHelpers(storedHelpers ?? legacyHelpersFromStore())
  const [primaryHelper, secondaryHelper] = helpers

  return {
    blitzPath: primaryHelper?.path ?? '',
    blitzName: primaryHelper?.displayName ?? '',
    launchWithWindows: store.get('launchWithWindows', DEFAULTS.launchWithWindows),
    pollingInterval: store.get('pollingInterval', DEFAULTS.pollingInterval),
    monitoringEnabled: store.get('monitoringEnabled', DEFAULTS.monitoringEnabled),
    leagueEnabled: store.get('leagueEnabled', DEFAULTS.leagueEnabled),
    valorantEnabled: store.get('valorantEnabled', DEFAULTS.valorantEnabled),
    blitzEnabled: primaryHelper?.enabled ?? false,
    porofessorPath: secondaryHelper?.path ?? '',
    porofessorName: secondaryHelper?.displayName ?? '',
    porofessorEnabled: secondaryHelper?.enabled ?? false,
    blitzVisible: primaryHelper?.showOnOverview ?? true,
    porofessorVisible: secondaryHelper?.showOnOverview ?? true,
    themeColor: DEFAULTS.themeColor,
    helpers
  }
}

export function saveSettings(s: AppSettings): void {
  const helpers = normalizeHelpers(s.helpers ?? legacyHelpersFromSettings(s))
  const [primaryHelper, secondaryHelper] = helpers

  store.set('helpers', helpers)
  store.set('blitzPath', primaryHelper?.path ?? '')
  store.set('blitzName', primaryHelper?.displayName ?? '')
  store.set('launchWithWindows', s.launchWithWindows)
  store.set('pollingInterval', s.pollingInterval)
  store.set('monitoringEnabled', s.monitoringEnabled)
  store.set('leagueEnabled', s.leagueEnabled)
  store.set('valorantEnabled', s.valorantEnabled)
  store.set('blitzEnabled', primaryHelper?.enabled ?? false)
  store.set('porofessorPath', secondaryHelper?.path ?? '')
  store.set('porofessorName', secondaryHelper?.displayName ?? '')
  store.set('porofessorEnabled', secondaryHelper?.enabled ?? false)
  store.set('blitzVisible', primaryHelper?.showOnOverview ?? true)
  store.set('porofessorVisible', secondaryHelper?.showOnOverview ?? true)
  store.set('themeColor', DEFAULTS.themeColor)
}

function legacyHelpersFromSettings(s: AppSettings): HelperConfig[] {
  return [
    {
      ...DEFAULT_HELPERS[0],
      path: s.blitzPath,
      displayName: s.blitzName,
      enabled: !!s.blitzPath && s.blitzEnabled,
      showOnOverview: s.blitzVisible
    },
    {
      ...DEFAULT_HELPERS[1],
      path: s.porofessorPath,
      displayName: s.porofessorName,
      enabled: !!s.porofessorPath && s.porofessorEnabled,
      showOnOverview: s.porofessorVisible
    }
  ]
}

function legacyHelpersFromStore(): HelperConfig[] {
  const blitzPath = store.get('blitzPath', DEFAULTS.blitzPath)
  const porofessorPath = store.get('porofessorPath', DEFAULTS.porofessorPath)

  return [
    {
      ...DEFAULT_HELPERS[0],
      path: blitzPath,
      displayName: store.get('blitzName', DEFAULTS.blitzName),
      enabled: !!blitzPath && store.get('blitzEnabled', true),
      showOnOverview: store.get('blitzVisible', DEFAULTS.blitzVisible)
    },
    {
      ...DEFAULT_HELPERS[1],
      path: porofessorPath,
      displayName: store.get('porofessorName', DEFAULTS.porofessorName),
      enabled: !!porofessorPath && store.get('porofessorEnabled', true),
      showOnOverview: store.get('porofessorVisible', DEFAULTS.porofessorVisible)
    }
  ]
}

function normalizeHelpers(helpers: HelperConfig[] | undefined): HelperConfig[] {
  const byId = new Map((helpers ?? []).map((helper) => [helper.id, helper]))

  return DEFAULT_HELPERS.map((defaultHelper) => {
    const stored = byId.get(defaultHelper.id)

    return {
      ...defaultHelper,
      ...stored,
      path: stored?.path ?? defaultHelper.path,
      displayName: stored?.displayName ?? defaultHelper.displayName,
      detectedName: stored?.detectedName ?? defaultHelper.detectedName,
      enabled: !!stored?.path && (stored?.enabled ?? defaultHelper.enabled),
      gameBindings: {
        league: stored?.gameBindings?.league ?? defaultHelper.gameBindings.league,
        valorant: stored?.gameBindings?.valorant ?? defaultHelper.gameBindings.valorant
      },
      showOnOverview: stored?.showOnOverview ?? defaultHelper.showOnOverview
    }
  })
}
