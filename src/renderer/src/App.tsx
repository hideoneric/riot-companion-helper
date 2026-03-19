import React, { useState, useEffect } from 'react'
import { Header } from './components/Header'
import { StatusPanel } from './components/StatusPanel'
import { ActivityLog } from './components/ActivityLog'

declare const window: Window & {
  api: {
    openSettings: () => void
    minimize: () => void
    hideToTray: () => void
    getState: () => Promise<{
      leagueRunning: boolean
      blitzRunning: boolean
      monitoringEnabled: boolean
      blitzPathSet: boolean
    }>
    onStateUpdate: (cb: (s: AppState) => void) => () => void
    onLogEntry: (cb: (e: LogEntry) => void) => () => void
  }
}

interface AppState {
  leagueRunning: boolean
  blitzRunning: boolean
  monitoringEnabled: boolean
  blitzPathSet: boolean
}

interface LogEntry {
  timestamp: string
  message: string
  level: 'info' | 'warn' | 'error'
}

export default function App() {
  const [state, setState] = useState<AppState>({
    leagueRunning: false,
    blitzRunning: false,
    monitoringEnabled: true,
    blitzPathSet: false,
  })
  const [logs, setLogs] = useState<LogEntry[]>([])

  useEffect(() => {
    window.api.getState().then(setState)
    const unsub1 = window.api.onStateUpdate(setState)
    const unsub2 = window.api.onLogEntry((e: LogEntry) =>
      setLogs((prev) => [e, ...prev].slice(0, 100))
    )
    return () => {
      unsub1()
      unsub2()
    }
  }, [])

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#0f0e17' }}>
      <Header
        onOpenSettings={() => window.api.openSettings()}
        onMinimize={() => window.api.minimize()}
        onClose={() => window.api.hideToTray()}
      />
      <StatusPanel {...state} />
      <ActivityLog entries={logs} />
    </div>
  )
}
