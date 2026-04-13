import React, { useEffect, useRef, useState } from 'react'
import type { AppState, LogEntry, Settings } from '../App'

interface Props {
  appState: AppState
  logs: LogEntry[]
  settings: Settings
  onSaveSettings: (s: Settings) => Promise<void>
  onNavigateToSettings: () => void
}

const levelColor: Record<LogEntry['level'], string> = {
  info: '#8e8e9a',
  warn: '#f0a500',
  error: '#e53935',
}

export function HomePage({ appState, logs, settings, onSaveSettings, onNavigateToSettings }: Props) {
  const { leagueRunning, blitzRunning, valorantRunning, monitoringEnabled, blitzPathSet, leagueEnabled, valorantEnabled, blitzEnabled, porofessorRunning, porofessorPathSet, porofessorEnabled } = appState
  const topRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    topRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs.length])

  const anyPathSet = blitzPathSet || porofessorPathSet
  const statusLabel = !anyPathSet
    ? 'WAITING FOR SETUP'
    : !monitoringEnabled
    ? 'MONITORING PAUSED'
    : 'MONITORING ACTIVE'
  const statusColor = !anyPathSet ? '#f0a500' : !monitoringEnabled ? '#555560' : 'var(--accent)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* ── Status ── */}
      <div style={{ padding: '24px 28px 20px', flexShrink: 0 }}>
        <SectionHeading>Monitoring</SectionHeading>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <span
            style={{
              width: 7, height: 7, borderRadius: '50%', background: statusColor, flexShrink: 0,
              boxShadow: monitoringEnabled && anyPathSet ? '0 0 8px color-mix(in srgb, var(--accent) 53%, transparent)' : 'none',
            }}
          />
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: statusColor }}>
            {statusLabel}
          </span>
          {!anyPathSet && <SettingsLink onClick={onNavigateToSettings} />}
        </div>

        {/* ── Game groups ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <GameGroup title="GAMES">
            <ProcessRow
              label="League of Legends"
              running={leagueRunning}
              enabled={leagueEnabled}
              onToggle={() => onSaveSettings({ ...settings, leagueEnabled: !leagueEnabled })}
            />
            <Divider />
            <ProcessRow
              label="Valorant"
              running={valorantRunning}
              enabled={valorantEnabled}
              onToggle={() => onSaveSettings({ ...settings, valorantEnabled: !valorantEnabled })}
            />
          </GameGroup>

          <GameGroup title="COMPANION">
            {settings.blitzVisible && (
              <>
                <CompanionRow
                  label="Blitz.gg"
                  running={blitzRunning}
                  enabled={blitzEnabled}
                  onToggle={() => onSaveSettings({ ...settings, blitzEnabled: !settings.blitzEnabled })}
                  onHide={() => onSaveSettings({ ...settings, blitzVisible: false })}
                />
                {settings.porofessorVisible && <Divider />}
              </>
            )}
            {settings.porofessorVisible && (
              <CompanionRow
                label="Porofessor"
                running={porofessorRunning}
                enabled={porofessorEnabled}
                onToggle={() => onSaveSettings({ ...settings, porofessorEnabled: !settings.porofessorEnabled })}
                onHide={() => onSaveSettings({ ...settings, porofessorVisible: false })}
              />
            )}
            {!settings.blitzVisible && !settings.porofessorVisible && (
              <div style={{ padding: '11px 16px', fontSize: 12, color: '#555560' }}>
                No helpers visible — restore in Settings → General
              </div>
            )}
            {(settings.blitzVisible || settings.porofessorVisible) &&
              (!settings.blitzVisible || !settings.porofessorVisible) && (
              <div style={{ padding: '4px 16px 10px', fontSize: 11, color: '#3a3a3e' }}>
                Restore hidden helpers in Settings → General
              </div>
            )}
          </GameGroup>
        </div>
      </div>

      <div style={{ height: 1, background: '#2c2c32', flexShrink: 0 }} />

      {/* ── Activity Log ── */}
      <div style={{ flex: 1, padding: '20px 28px 24px', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <SectionHeading>Activity Log</SectionHeading>

        <div
          style={{
            flex: 1, overflowY: 'auto', background: '#28282d',
            borderRadius: 8, border: '1px solid #2c2c32', padding: '10px 14px', minHeight: 0,
          }}
        >
          {logs.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#3a3a3e', fontSize: 12 }}>
              No activity yet
            </div>
          ) : (
            <>
              <div ref={topRef} />
              {logs.map((e) => (
                <div key={`${e.timestamp}-${e.message}`} style={{ display: 'flex', gap: 12, fontSize: 12, marginBottom: 5, lineHeight: 1.6 }}>
                  <span style={{ color: '#3a3a3e', minWidth: 60, flexShrink: 0, fontFamily: 'monospace' }}>
                    {e.timestamp}
                  </span>
                  <span style={{ color: levelColor[e.level] }}>{e.message}</span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function GameGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: '#3a3a3e', marginBottom: 6, paddingLeft: 2 }}>
        {title}
      </div>
      <div style={{ background: '#28282d', borderRadius: 8, border: '1px solid #2c2c32', overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  )
}

function Divider() {
  return <div style={{ height: 1, background: '#2c2c32' }} />
}

function ToggleSwitch({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      title={on ? 'Disable' : 'Enable'}
      style={{
        width: 30, height: 16, borderRadius: 8, border: 'none', padding: 0,
        cursor: 'pointer', background: on ? 'var(--accent)' : '#3a3a3e',
        position: 'relative', flexShrink: 0, transition: 'background 0.2s',
      }}
    >
      <span style={{
        position: 'absolute', top: 2, left: on ? 16 : 2,
        width: 12, height: 12, borderRadius: '50%', background: '#ffffff',
        transition: 'left 0.2s',
      }} />
    </button>
  )
}

function ProcessRow({
  label, running,
  enabled, onToggle,
}: {
  label: string
  running: boolean
  enabled?: boolean
  onToggle?: () => void
}) {
  const isEnabled = enabled ?? true
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '11px 16px', opacity: isEnabled ? 1 : 0.5, transition: 'opacity 0.2s',
    }}>
      <span style={{ fontSize: 13, color: '#d0d0d8' }}>{label}</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {onToggle && <ToggleSwitch on={isEnabled} onToggle={onToggle} />}
        {isEnabled ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{
              width: 7, height: 7, borderRadius: '50%',
              background: running ? '#4caf50' : '#3a3a3e',
              boxShadow: running ? '0 0 6px #4caf5066' : 'none',
              transition: 'background 0.3s, box-shadow 0.3s',
            }} />
            <span style={{ fontSize: 12, color: running ? '#4caf50' : '#555560', minWidth: 72 }}>
              {running ? 'Running' : 'Not Running'}
            </span>
          </span>
        ) : (
          <span style={{ fontSize: 12, color: '#3a3a3e', minWidth: 72 }}>Disabled</span>
        )}
      </span>
    </div>
  )
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ fontSize: 12, fontWeight: 600, color: '#ffffff', margin: '0 0 12px', paddingBottom: 8, borderBottom: '1px solid #2c2c32' }}>
      {children}
    </h2>
  )
}

function CompanionRow({ label, running, enabled, onToggle, onHide }: {
  label: string
  running: boolean
  enabled: boolean
  onToggle: () => void
  onHide: () => void
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '11px 16px', opacity: enabled ? 1 : 0.5, transition: 'opacity 0.2s',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span style={{ fontSize: 13, color: '#d0d0d8' }}>{label}</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <ToggleSwitch on={enabled} onToggle={onToggle} />
        {enabled ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{
              width: 7, height: 7, borderRadius: '50%',
              background: running ? '#4caf50' : '#3a3a3e',
              boxShadow: running ? '0 0 6px #4caf5066' : 'none',
              transition: 'background 0.3s, box-shadow 0.3s',
            }} />
            <span style={{ fontSize: 12, color: running ? '#4caf50' : '#555560', minWidth: 72 }}>
              {running ? 'Running' : 'Not Running'}
            </span>
          </span>
        ) : (
          <span style={{ fontSize: 12, color: '#3a3a3e', minWidth: 72 }}>Disabled</span>
        )}
        <button
          onClick={onHide}
          title="Hide on Home page"
          style={{
            width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'transparent', border: 'none', borderRadius: 3, padding: 0,
            cursor: 'pointer', color: hovered ? '#555560' : 'transparent',
            transition: 'color 0.15s',
            flexShrink: 0,
          }}
        >
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
            <line x1="1" y1="1" x2="7" y2="7" />
            <line x1="7" y1="1" x2="1" y2="7" />
          </svg>
        </button>
      </span>
    </div>
  )
}

function SettingsLink({ onClick }: { onClick: () => void }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        marginLeft: 8, background: 'transparent',
        border: `1px solid ${hovered ? 'var(--accent)' : '#2c2c32'}`,
        borderRadius: 5, color: hovered ? '#fff' : '#8e8e9a',
        cursor: 'pointer', fontSize: 11, padding: '3px 10px',
        transition: 'border-color 0.15s, color 0.15s',
      }}
    >
      Open Settings
    </button>
  )
}
