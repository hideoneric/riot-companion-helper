import React, { useState, useEffect } from 'react'
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
  }
}

export interface AppState {
  leagueRunning: boolean
  blitzRunning: boolean
  valorantRunning: boolean
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

export type Page = 'home' | 'settings'
export type SubPage = 'general' | 'behavior'

export default function App() {
  const [activePage, setActivePage] = useState<Page>('home')
  const [activeSubPage, setActiveSubPage] = useState<SubPage>('general')
  const [appState, setAppState] = useState<AppState>({
    leagueRunning: false,
    blitzRunning: false,
    valorantRunning: false,
    valorantTrackerRunning: false,
    monitoringEnabled: true,
    blitzPathSet: false,
    valorantTrackerPathSet: false,
  })
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [settings, setSettings] = useState<Settings>({
    blitzPath: '',
    valorantTrackerPath: '',
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
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#111114' }}>
      {/* Full-width titlebar with window controls top-right */}
      <Titlebar
        onMinimize={() => window.api.minimize()}
        onClose={() => window.api.hideToTray()}
      />

      {/* Body: sidebar + content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'row', overflow: 'hidden', minHeight: 0 }}>
        <Sidebar activePage={activePage} onNavigate={setActivePage} />

        {activePage === 'settings' && (
          <SubNav activeSub={activeSubPage} onNavigate={setActiveSubPage} />
        )}

        <main style={{ flex: 1, minWidth: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', background: '#1f1f23' }}>
          {activePage === 'home' && (
            <HomePage
              appState={appState}
              logs={logs}
              onNavigateToSettings={() => { setActivePage('settings'); setActiveSubPage('general') }}
            />
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
    </div>
  )
}

function Titlebar({ onMinimize, onClose }: { onMinimize: () => void; onClose: () => void }) {
  return (
    <div
      style={{
        height: 38,
        background: '#111114',
        display: 'flex',
        alignItems: 'center',
        paddingLeft: 16,
        paddingRight: 8,
        borderBottom: '1px solid #2c2c32',
        flexShrink: 0,
        WebkitAppRegion: 'drag',
      } as React.CSSProperties}
    >
      <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: '#8e8e9a', letterSpacing: '0.02em' }}>
        Riot Companion Helper
      </span>
      <div style={{ display: 'flex', gap: 2, WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        <TitleBtn onClick={onMinimize} hoverColor="#555560">
          <svg width="10" height="2" viewBox="0 0 10 2" fill="currentColor">
            <rect width="10" height="2" rx="1" />
          </svg>
        </TitleBtn>
        <TitleBtn onClick={onClose} hoverColor="#c0392b">
          <svg width="9" height="9" viewBox="0 0 9 9" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
            <line x1="1" y1="1" x2="8" y2="8" />
            <line x1="8" y1="1" x2="1" y2="8" />
          </svg>
        </TitleBtn>
      </div>
    </div>
  )
}

function TitleBtn({ onClick, hoverColor, children }: { onClick: () => void; hoverColor: string; children: React.ReactNode }) {
  const [hovered, setHovered] = React.useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 28,
        height: 28,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: hovered ? 'rgba(255,255,255,0.07)' : 'transparent',
        border: 'none',
        borderRadius: 4,
        color: hovered ? hoverColor : '#444450',
        cursor: 'pointer',
        transition: 'background 0.12s, color 0.12s',
        padding: 0,
      }}
    >
      {children}
    </button>
  )
}
