import React, { useEffect, useState } from 'react'
import { Sidebar } from './components/Sidebar'
import { SubNav } from './components/SubNav'
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
  launchWithWindows: boolean
  pollingInterval: number
  monitoringEnabled: boolean
  leagueEnabled: boolean
  valorantEnabled: boolean
  blitzEnabled: boolean
  porofessorPath: string
  porofessorEnabled: boolean
  blitzVisible: boolean
  porofessorVisible: boolean
  themeColor: string
}

export type Page = 'home' | 'settings'
export type SubPage = 'general' | 'behavior'

export type UpdateStatus =
  | { status: 'checking' | 'available' | 'not-available' }
  | { status: 'downloading'; version: string; progress: number }
  | { status: 'ready'; version: string }
  | { status: 'error'; message: string }

export default function App() {
  const [activePage, setActivePage] = useState<Page>('home')
  const [activeSubPage, setActiveSubPage] = useState<SubPage>('general')
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
    launchWithWindows: false,
    pollingInterval: 3,
    monitoringEnabled: true,
    leagueEnabled: true,
    valorantEnabled: true,
    blitzEnabled: true,
    porofessorPath: '',
    porofessorEnabled: true,
    blitzVisible: true,
    porofessorVisible: true,
    themeColor: '#7c5cbf'
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

  const navigateSettings = (subPage: SubPage = 'general') => {
    setActivePage('settings')
    setActiveSubPage(subPage)
  }

  return (
    <div className="app-shell" style={{ '--accent': settings.themeColor } as React.CSSProperties}>
      <Titlebar onMinimize={() => window.api.minimize()} onClose={() => window.api.hideToTray()} />

      {updateStatus?.status === 'ready' && !updateDismissed && (
        <UpdateBanner
          version={updateStatus.version}
          onInstall={() => window.api.installUpdate()}
          onDismiss={() => setUpdateDismissed(true)}
        />
      )}

      <div className="app-body">
        <Sidebar
          activePage={activePage}
          appState={appState}
          settings={settings}
          onNavigate={setActivePage}
        />

        {activePage === 'settings' && (
          <SubNav activeSub={activeSubPage} onNavigate={setActiveSubPage} />
        )}

        <main className="app-main">
          {activePage === 'home' && (
            <HomePage
              appState={appState}
              logs={logs}
              settings={settings}
              onSaveSettings={handleSaveSettings}
              onNavigateToSettings={() => navigateSettings('general')}
            />
          )}
          {activePage === 'settings' && (
            <SettingsPage sub={activeSubPage} settings={settings} onSave={handleSaveSettings} />
          )}
        </main>
      </div>
    </div>
  )
}

function Titlebar({ onMinimize, onClose }: { onMinimize: () => void; onClose: () => void }) {
  return (
    <header className="titlebar">
      <div className="titlebar-brand">
        <span className="titlebar-mark">R</span>
        <span>Riot Companion Helper</span>
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
