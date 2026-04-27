import { useEffect, useRef } from 'react'
import type { AppState, LogEntry, Settings } from '../App'
import {
  CommandCard,
  IconButton,
  PrimaryButton,
  SectionLabel,
  StatusDot,
  ToggleSwitch
} from '../components/CommandUi'
import { getEntityTone, getReadiness, toneColor } from '../lib/command-center'

interface Props {
  appState: AppState
  logs: LogEntry[]
  settings: Settings
  onSaveSettings: (s: Settings) => Promise<void>
  onNavigateToSettings: () => void
}

const levelColor: Record<LogEntry['level'], string> = {
  info: '#9ca3af',
  warn: '#f0a500',
  error: '#ef4444'
}

export function HomePage({
  appState,
  logs,
  settings,
  onSaveSettings,
  onNavigateToSettings
}: Props) {
  const topRef = useRef<HTMLDivElement>(null)
  const pathConfigured = appState.blitzPathSet || appState.porofessorPathSet
  const readiness = getReadiness({
    pathConfigured,
    monitoringEnabled: appState.monitoringEnabled
  })

  useEffect(() => {
    topRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs.length])

  return (
    <div className="command-page">
      <section className="command-top">
        <CommandCard className={`readiness-card ${readiness.tone}`}>
          <div className="readiness-main">
            <div className="readiness-state">
              <StatusDot tone={readiness.tone} pulse={readiness.tone === 'active'} />
              <span>{readiness.label}</span>
            </div>
            <h1>Command Center</h1>
            <p>{readiness.description}</p>
          </div>
          <div className="readiness-meta">
            <Metric
              label="Games enabled"
              value={enabledCount(appState.leagueEnabled, appState.valorantEnabled)}
            />
            <Metric
              label="Helpers visible"
              value={enabledCount(settings.blitzVisible, settings.porofessorVisible)}
            />
            {!pathConfigured && (
              <PrimaryButton onClick={onNavigateToSettings}>Configure paths</PrimaryButton>
            )}
          </div>
        </CommandCard>
      </section>

      <div className="command-grid">
        <section className="command-stack">
          <SectionLabel>Games</SectionLabel>
          <div className="entity-grid">
            <EntityCard
              name="League of Legends"
              category="Game process"
              running={appState.leagueRunning}
              enabled={appState.leagueEnabled}
              onToggle={() =>
                onSaveSettings({ ...settings, leagueEnabled: !appState.leagueEnabled })
              }
            />
            <EntityCard
              name="Valorant"
              category="Game process"
              running={appState.valorantRunning}
              enabled={appState.valorantEnabled}
              onToggle={() =>
                onSaveSettings({ ...settings, valorantEnabled: !appState.valorantEnabled })
              }
            />
          </div>

          <SectionLabel>Companions</SectionLabel>
          <div className="entity-grid companion-grid">
            {settings.blitzVisible && (
              <EntityCard
                name="Blitz.gg"
                category={appState.blitzPathSet ? 'Configured helper' : 'Path missing'}
                running={appState.blitzRunning}
                enabled={appState.blitzEnabled}
                pathSet={appState.blitzPathSet}
                onToggle={() =>
                  onSaveSettings({ ...settings, blitzEnabled: !appState.blitzEnabled })
                }
                onHide={() => onSaveSettings({ ...settings, blitzVisible: false })}
              />
            )}
            {settings.porofessorVisible && (
              <EntityCard
                name="Porofessor"
                category={appState.porofessorPathSet ? 'League helper' : 'Path missing'}
                running={appState.porofessorRunning}
                enabled={appState.porofessorEnabled}
                pathSet={appState.porofessorPathSet}
                onToggle={() =>
                  onSaveSettings({ ...settings, porofessorEnabled: !appState.porofessorEnabled })
                }
                onHide={() => onSaveSettings({ ...settings, porofessorVisible: false })}
              />
            )}
            {!settings.blitzVisible && !settings.porofessorVisible && (
              <CommandCard className="empty-companions">
                <SectionLabel>No visible companions</SectionLabel>
                <p>Restore hidden helpers from Settings, then they will appear here again.</p>
                <PrimaryButton onClick={onNavigateToSettings}>Open Settings</PrimaryButton>
              </CommandCard>
            )}
          </div>
          {(settings.blitzVisible || settings.porofessorVisible) &&
            (!settings.blitzVisible || !settings.porofessorVisible) && (
              <button className="restore-link" onClick={onNavigateToSettings}>
                Restore hidden helpers in Settings
              </button>
            )}
        </section>

        <CommandCard className="activity-panel">
          <div className="activity-header">
            <div>
              <SectionLabel>Activity</SectionLabel>
              <h2>Recent events</h2>
            </div>
            <span>{logs.length} entries</span>
          </div>
          <div className="activity-log">
            {logs.length === 0 ? (
              <div className="activity-empty">No activity yet</div>
            ) : (
              <>
                <div ref={topRef} />
                {logs.map((entry) => (
                  <div key={`${entry.timestamp}-${entry.message}`} className="activity-row">
                    <time>{entry.timestamp}</time>
                    <span style={{ color: levelColor[entry.level] }}>{entry.message}</span>
                  </div>
                ))}
              </>
            )}
          </div>
        </CommandCard>
      </div>
    </div>
  )
}

function EntityCard({
  name,
  category,
  running,
  enabled,
  pathSet = true,
  onToggle,
  onHide
}: {
  name: string
  category: string
  running: boolean
  enabled: boolean
  pathSet?: boolean
  onToggle: () => void
  onHide?: () => void
}) {
  const state = getEntityTone({ enabled, running })
  const color = toneColor(state.tone)

  return (
    <CommandCard className={`entity-card ${state.tone} ${!pathSet ? 'missing-path' : ''}`.trim()}>
      <div className="entity-card-top">
        <div>
          <div className="entity-category">{category}</div>
          <h2>{name}</h2>
        </div>
        {onHide && (
          <IconButton title={`Hide ${name} on Home page`} onClick={onHide}>
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
          </IconButton>
        )}
      </div>

      <div className="entity-state">
        <span style={{ borderColor: `${color}66`, color }}>
          <StatusDot tone={state.tone} pulse={state.tone === 'running'} />
          {state.label}
        </span>
        {!pathSet && <small>Configure path to launch</small>}
      </div>

      <div className="entity-actions">
        <span>{enabled ? 'Enabled' : 'Disabled'}</span>
        <ToggleSwitch on={enabled} onToggle={onToggle} />
      </div>
    </CommandCard>
  )
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="readiness-metric">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  )
}

function enabledCount(...items: boolean[]): number {
  return items.filter(Boolean).length
}
