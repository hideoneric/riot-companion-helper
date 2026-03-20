import React, { useState, useEffect } from 'react'
import { Sidebar } from './components/Sidebar'
import { SubNav } from './components/SubNav'
import { DashboardPage } from './pages/DashboardPage'
import { ActivityPage } from './pages/ActivityPage'
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
  }
}

export interface AppState {
  leagueRunning: boolean
  blitzRunning: boolean
  monitoringEnabled: boolean
  blitzPathSet: boolean
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
}

export type Page = 'dashboard' | 'activity' | 'settings'
export type SubPage = 'general' | 'behavior'

export default function App() {
  const [activePage, setActivePage] = useState<Page>('dashboard')
  const [activeSubPage, setActiveSubPage] = useState<SubPage>('general')
  const [appState, setAppState] = useState<AppState>({
    leagueRunning: false,
    blitzRunning: false,
    monitoringEnabled: true,
    blitzPathSet: false,
  })
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [settings, setSettings] = useState<Settings>({
    blitzPath: '',
    launchWithWindows: false,
    pollingInterval: 3,
    monitoringEnabled: true,
  })

  useEffect(() => {
    if (!(window as any).api) return
    try {
      window.api.getState().then(setAppState).catch(console.error)
      window.api.getSettings().then(setSettings).catch(console.error)
      const unsub1 = window.api.onStateUpdate(setAppState)
      const unsub2 = window.api.onLogEntry((e) =>
        setLogs((prev) => [e, ...prev].slice(0, 100))
      )
      const unsub3 = window.api.onNavigate((page) => {
        if (page === 'settings') setActivePage('settings')
      })
      return () => { unsub1(); unsub2(); unsub3() }
    } catch (err) {
      console.error('window.api error:', err)
    }
  }, [])

  const handleSaveSettings = async (s: Settings) => {
    await window.api.saveSettings(s)
    setSettings(s)
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'row', background: '#111114', overflow: 'hidden' }}>
      <Sidebar
        activePage={activePage}
        onNavigate={setActivePage}
        onMinimize={() => window.api.minimize()}
        onClose={() => window.api.hideToTray()}
      />
      {activePage === 'settings' && (
        <SubNav activeSub={activeSubPage} onNavigate={setActiveSubPage} />
      )}
      <main style={{ flex: 1, overflow: 'auto', background: '#1f1f23', display: 'flex', flexDirection: 'column' }}>
        {activePage === 'dashboard' && (
          <DashboardPage
            {...appState}
            onNavigateToSettings={() => { setActivePage('settings'); setActiveSubPage('general') }}
          />
        )}
        {activePage === 'activity' && (
          <ActivityPage entries={logs} />
        )}
        {activePage === 'settings' && (
          <SettingsPage
            sub={activeSubPage}
            settings={settings}
            onSave={handleSaveSettings}
          />
        )}
      </main>
    </div>
  )
}
