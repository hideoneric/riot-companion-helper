import React, { useEffect, useState } from 'react'
import { HomePage } from './pages/HomePage'
import { SettingsPage } from './pages/SettingsPage'

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
}

export type Page = 'dashboard' | 'games' | 'companions' | 'activity' | 'settings'

export type UpdateStatus =
  | { status: 'checking' | 'available' | 'not-available' }
  | { status: 'downloading'; version: string; progress: number }
  | { status: 'ready'; version: string }
  | { status: 'error'; message: string }

export default function App() {
  const [activePage, setActivePage] = useState<Page>('dashboard')
  const [appState, setAppState] = useState<AppState>({
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
  })
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus | null>(null)
  const [updateDismissed, setUpdateDismissed] = useState(false)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [settings, setSettings] = useState<Settings>({
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
  })

  useEffect(() => {
    if (!window.api) return undefined

    try {
      window.api.getState().then(setAppState).catch(console.error)
      window.api.getSettings().then(setSettings).catch(console.error)
      const unsubState = window.api.onStateUpdate(setAppState)
      const unsubLog = window.api.onLogEntry((entry) =>
        setLogs((prev) => [entry, ...prev].slice(0, 100))
      )
      const unsubNavigate = window.api.onNavigate((page) => {
        if (page === 'settings') setActivePage('settings')
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

  const handleSaveSettings = async (nextSettings: Settings) => {
    await window.api.saveSettings(nextSettings)
    setSettings(nextSettings)
  }

  return (
    <div className="app-shell" style={{ '--accent': settings.themeColor } as React.CSSProperties}>
      <Titlebar
        appState={appState}
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

      <div className="app-body">
        <main className="app-main">
          <TopTabs activePage={activePage} onNavigate={setActivePage} />
          {activePage !== 'settings' && (
            <HomePage
              activePage={activePage}
              appState={appState}
              logs={logs}
              settings={settings}
              onSaveSettings={handleSaveSettings}
              onNavigate={setActivePage}
            />
          )}
          {activePage === 'settings' && (
            <SettingsPage settings={settings} onSave={handleSaveSettings} />
          )}
        </main>
      </div>
    </div>
  )
}

function Titlebar({
  appState,
  onMinimize,
  onClose
}: {
  appState: AppState
  onMinimize: () => void
  onClose: () => void
}) {
  const ready = (appState.blitzPathSet || appState.porofessorPathSet) && appState.monitoringEnabled
  const label =
    !appState.blitzPathSet && !appState.porofessorPathSet
      ? 'Setup needed'
      : appState.monitoringEnabled
        ? 'Monitoring active'
        : 'Monitoring paused'

  return (
    <header className="titlebar">
      <div className="titlebar-left">
        <div className="titlebar-brand">
          <span className="titlebar-mark">R</span>
          <span>Riot Companion Helper</span>
        </div>
        <span className={`titlebar-status ${ready ? 'active' : 'muted'}`.trim()}>
          <span />
          {label}
        </span>
      </div>
      <div className="titlebar-actions">
        <TitleBtn title="Minimize" onClick={onMinimize}>
          <svg width="10" height="2" viewBox="0 0 10 2" fill="currentColor" aria-hidden="true">
            <rect width="10" height="2" rx="1" />
          </svg>
        </TitleBtn>
        <TitleBtn title="Hide to tray" onClick={onClose} danger>
          <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <path d="M1.5 1.5 8.5 8.5" />
            <path d="M8.5 1.5 1.5 8.5" />
          </svg>
        </TitleBtn>
      </div>
    </header>
  )
}

const TABS: { page: Page; label: string }[] = [
  { page: 'dashboard', label: 'Dashboard' },
  { page: 'games', label: 'Games' },
  { page: 'companions', label: 'Companions' },
  { page: 'activity', label: 'Activity' },
  { page: 'settings', label: 'Settings' }
]

function TopTabs({
  activePage,
  onNavigate
}: {
  activePage: Page
  onNavigate: (page: Page) => void
}) {
  return (
    <nav className="top-tabs">
      {TABS.map((item) => (
        <button
          key={item.page}
          className={`top-tab ${activePage === item.page ? 'active' : ''}`.trim()}
          onClick={() => onNavigate(item.page)}
        >
          {item.label}
        </button>
      ))}
    </nav>
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
      <span>Update v{version} is ready</span>
      <div className="update-actions">
        <button className="cc-button primary compact" onClick={onInstall}>
          Update & Restart
        </button>
        <button className="cc-icon-button" onClick={onDismiss} title="Dismiss" aria-label="Dismiss">
          <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <path d="M1.5 1.5 8.5 8.5" />
            <path d="M8.5 1.5 1.5 8.5" />
          </svg>
        </button>
      </div>
    </div>
  )
}

function TitleBtn({
  title,
  onClick,
  danger = false,
  children
}: {
  title: string
  onClick: () => void
  danger?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      className={`titlebar-button ${danger ? 'danger' : ''}`.trim()}
      onClick={onClick}
      title={title}
      aria-label={title}
    >
      {children}
    </button>
  )
}
