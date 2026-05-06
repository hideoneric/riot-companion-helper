import React, { useCallback, useEffect, useState } from 'react'
import { HomePage } from './pages/HomePage'

declare const window: Window & {
  api: {
    openSettings: () => void
    minimize: () => void
    hideToTray: () => void
    getState: () => Promise<AppState>
    onStateUpdate: (cb: (s: AppState) => void) => () => void
    onLogEntry: (cb: (e: LogEntry) => void) => () => void
    getSettings: () => Promise<Settings>
    saveSettings: (s: Settings) => Promise<void>
    browse: () => Promise<string | null>
    onNavigate: (cb: (page: string) => void) => () => void
    onUpdateStatus: (cb: (s: UpdateStatus) => void) => () => void
    checkForUpdates: () => Promise<void>
    installUpdate: () => void
  }
}

export interface AppState {
  leagueRunning: boolean
  blitzRunning: boolean
  valorantRunning: boolean
  monitoringEnabled: boolean
  blitzPathSet: boolean
  leagueEnabled: boolean
  valorantEnabled: boolean
  blitzEnabled: boolean
  porofessorRunning: boolean
  porofessorPathSet: boolean
  porofessorEnabled: boolean
}

export interface LogEntry {
  timestamp: string
  message: string
  level: 'info' | 'warn' | 'error'
}

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

export interface Settings {
  blitzPath: string
  blitzName: string
  launchWithWindows: boolean
  pollingInterval: number
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

export type Page = 'overview' | 'settings'

export type UpdateStatus =
  | { status: 'checking' }
  | { status: 'available'; version: string }
  | { status: 'not-available' }
  | { status: 'downloading'; version: string; progress: number }
  | { status: 'ready'; version: string }
  | { status: 'error'; message: string }

const DEFAULT_SETTINGS: Settings = {
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
  helpers: [
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
}

export default function App() {
  const [appState, setAppState] = useState<AppState>({
    leagueRunning: false,
    blitzRunning: false,
    valorantRunning: false,
    monitoringEnabled: true,
    blitzPathSet: false,
    leagueEnabled: true,
    valorantEnabled: true,
    blitzEnabled: false,
    porofessorRunning: false,
    porofessorPathSet: false,
    porofessorEnabled: false
  })
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus | null>(null)
  const [updateDismissed, setUpdateDismissed] = useState(false)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [inspectorSignal, setInspectorSignal] = useState(0)

  useEffect(() => {
    if (!window.api) return undefined

    try {
      window.api.getState().then(setAppState).catch(console.error)
      window.api.getSettings().then(setSettings).catch(console.error)
      const unsubState = window.api.onStateUpdate(setAppState)
      const unsubLog = window.api.onLogEntry((entry) =>
        setLogs((prev) => [entry, ...prev].slice(0, 8))
      )
      const unsubNavigate = window.api.onNavigate((page) => {
        if (page === 'settings') {
          setInspectorSignal((value) => value + 1)
        }
      })
      const unsubUpdate = window.api.onUpdateStatus(setUpdateStatus)

      return () => {
        unsubState()
        unsubLog()
        unsubNavigate()
        unsubUpdate()
      }
    } catch (err) {
      console.error('window.api error:', err)
      return undefined
    }
  }, [])

  const handleSaveSettings = useCallback(async (nextSettings: Settings) => {
    await window.api.saveSettings(nextSettings)
    setSettings(nextSettings)
  }, [])

  return (
    <div className="app-shell">
      <Titlebar
        appState={appState}
        onSettings={() => setInspectorSignal((value) => value + 1)}
        onMinimize={() => window.api.minimize()}
        onClose={() => window.api.hideToTray()}
      />

      {updateStatus?.status === 'ready' && !updateDismissed && (
        <UpdateBanner
          version={updateStatus.version}
          onInstall={() => window.api.installUpdate()}
          onDismiss={() => setUpdateDismissed(true)}
        />
      )}

      <main className="app-main">
        <HomePage
          appState={appState}
          logs={logs}
          settings={settings}
          updateStatus={updateStatus}
          inspectorSignal={inspectorSignal}
          onSaveSettings={handleSaveSettings}
          onCheckForUpdates={() => window.api.checkForUpdates()}
          onInstallUpdate={() => window.api.installUpdate()}
        />
      </main>
    </div>
  )
}

function Titlebar({
  appState,
  onSettings,
  onMinimize,
  onClose
}: {
  appState: AppState
  onSettings: () => void
  onMinimize: () => void
  onClose: () => void
}) {
  const hasHelper = appState.blitzPathSet || appState.porofessorPathSet
  const label = !hasHelper
    ? 'Setup needed'
    : appState.monitoringEnabled
      ? 'Monitoring on'
      : 'Monitoring off'
  const statusClass = !hasHelper ? 'setup' : appState.monitoringEnabled ? 'running' : 'idle'

  return (
    <header className="titlebar">
      <div className="titlebar-left">
        <div className="app-mark">R</div>
        <div className="app-name">Riot Companion Helper</div>
        <div className={`titlebar-status ${statusClass}`}>{label}</div>
      </div>
      <div className="titlebar-actions">
        <TitleButton title="Settings" onClick={onSettings}>
          <span className="material-symbols-rounded titlebar-icon" aria-hidden="true">
            settings
          </span>
        </TitleButton>
        <TitleButton title="Minimize" onClick={onMinimize}>
          -
        </TitleButton>
        <TitleButton title="Hide to tray" onClick={onClose}>
          x
        </TitleButton>
      </div>
    </header>
  )
}

function UpdateBanner({
  version,
  onInstall,
  onDismiss
}: {
  version: string
  onInstall: () => void
  onDismiss: () => void
}) {
  return (
    <div className="update-banner">
      <span>Update v{version} is ready.</span>
      <div className="update-actions">
        <button className="button compact" onClick={onInstall}>
          Restart
        </button>
        <button className="text-button muted" onClick={onDismiss}>
          Dismiss
        </button>
      </div>
    </div>
  )
}

function TitleButton({
  title,
  onClick,
  children
}: {
  title: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button className="titlebar-button" onClick={onClick} title={title} aria-label={title}>
      {children}
    </button>
  )
}
