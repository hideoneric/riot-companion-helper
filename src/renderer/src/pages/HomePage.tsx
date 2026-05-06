import { useEffect, useMemo, useRef } from 'react'
import type { AppState, HelperConfig, LogEntry, Settings, UpdateStatus } from '../App'
import leagueLogo from '../assets/league-logo.svg'
import valorantLogo from '../assets/valorant-logo.svg'
import { ControlInspector } from '../components/ControlInspector'
import { Icon, SectionHeader, StatusPill, Toggle } from '../components/MaterialControls'
import { getCompanionDisplayName } from '../lib/companion-display'
import { getCommandSummary, getEntityTone, getReadiness } from '../lib/command-center'

export { SectionHeader, Toggle } from '../components/MaterialControls'

interface Props {
  appState: AppState
  logs: LogEntry[]
  settings: Settings
  updateStatus: UpdateStatus | null
  inspectorSignal: number
  onSaveSettings: (s: Settings) => Promise<void>
  onCheckForUpdates: () => Promise<void>
  onInstallUpdate: () => void
}

const levelClass: Record<LogEntry['level'], string> = {
  info: 'info',
  warn: 'setup',
  error: 'error'
}

export function HomePage({
  appState,
  logs,
  settings,
  updateStatus,
  inspectorSignal,
  onSaveSettings,
  onCheckForUpdates,
  onInstallUpdate
}: Props) {
  const inspectorRef = useRef<HTMLElement>(null)
  const helpers = settings.helpers
  const visibleLogs = useMemo(() => logs.slice(0, 4), [logs])
  const hasHelper = helpers.some((helper) => helper.path)
  const readiness = getReadiness({
    pathConfigured: hasHelper,
    monitoringEnabled: settings.monitoringEnabled
  })
  const configuredHelpers = helpers.filter((helper) => helper.path).length
  const runningHelpers = Number(appState.blitzRunning) + Number(appState.porofessorRunning)
  const summary = getCommandSummary({
    leagueRunning: appState.leagueRunning,
    valorantRunning: appState.valorantRunning,
    configuredHelpers,
    runningHelpers
  })

  useEffect(() => {
    if (!inspectorSignal) return
    inspectorRef.current?.focus()
  }, [inspectorSignal])

  return (
    <div className="page command-page">
      <section className="command-workspace" aria-label="Command center">
        <div className={`command-card tone-${readiness.tone}`}>
          <div className="command-status">
            <div className="status-copy">
              <div className="status-kicker">
                <span className="status-dot" aria-hidden="true" />
                <span>{readiness.label}</span>
              </div>
              <p>{readiness.description}</p>
            </div>
            <Toggle
              checked={settings.monitoringEnabled}
              label="Monitoring"
              onToggle={() =>
                onSaveSettings({ ...settings, monitoringEnabled: !settings.monitoringEnabled })
              }
            />
          </div>

          <div className="command-metrics" aria-label="Current state">
            <Metric icon="sports_esports" label="Games" value={`${summary.activeGames} active`} />
            <Metric icon="rocket_launch" label="Helpers" value={summary.helperLabel} />
            <Metric icon="timer" label="Polling" value={`${settings.pollingInterval} sec`} />
          </div>
        </div>

        <section className="game-surface" aria-label="Games">
          <GameControlRow
            logo={leagueLogo}
            name="League of Legends"
            running={appState.leagueRunning}
            enabled={settings.leagueEnabled}
            helperNames={helperNamesForGame(helpers, 'league')}
            onToggle={() => onSaveSettings({ ...settings, leagueEnabled: !settings.leagueEnabled })}
          />
          <GameControlRow
            logo={valorantLogo}
            name="Valorant"
            running={appState.valorantRunning}
            enabled={settings.valorantEnabled}
            helperNames={helperNamesForGame(helpers, 'valorant')}
            onToggle={() =>
              onSaveSettings({ ...settings, valorantEnabled: !settings.valorantEnabled })
            }
          />
        </section>

        <section className="activity-panel" aria-label="Activity">
          <SectionHeader icon="history" title="Activity" compact />
          <ActivityList logs={visibleLogs} />
        </section>
      </section>

      <ControlInspector
        helpers={helpers}
        settings={settings}
        updateStatus={updateStatus}
        inspectorRef={inspectorRef}
        onSaveSettings={onSaveSettings}
        onCheckForUpdates={onCheckForUpdates}
        onInstallUpdate={onInstallUpdate}
      />
    </div>
  )
}

function GameControlRow({
  logo,
  name,
  running,
  enabled,
  helperNames,
  onToggle
}: {
  logo: string
  name: string
  running: boolean
  enabled: boolean
  helperNames: string[]
  onToggle: () => void
}) {
  const state = getEntityTone({ enabled, running })

  return (
    <article className="game-row">
      <img className="brand-logo" src={logo} alt="" aria-hidden="true" />
      <div className="game-main">
        <h3>{name}</h3>
        <div className="chip-row">
          <StatusPill tone={state.tone}>{state.label}</StatusPill>
          {helperNames.length > 0 ? (
            helperNames.map((helper) => (
              <span key={helper} className="neutral-chip">
                {helper}
              </span>
            ))
          ) : (
            <span className="neutral-chip muted">No helper</span>
          )}
        </div>
      </div>
      <Toggle checked={enabled} label={name} onToggle={onToggle} />
    </article>
  )
}

function Metric({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="command-metric">
      <Icon name={icon} />
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  )
}

function ActivityList({ logs }: { logs: LogEntry[] }) {
  return (
    <div className="activity-list">
      {logs.length === 0 ? (
        <div className="activity-empty">
          <Icon name="history" />
          <span>No activity yet</span>
        </div>
      ) : (
        logs.map((entry) => (
          <div key={`${entry.timestamp}-${entry.message}`} className="activity-row">
            <time>{entry.timestamp}</time>
            <span className={levelClass[entry.level]}>{entry.message}</span>
          </div>
        ))
      )}
    </div>
  )
}

function helperNamesForGame(helpers: HelperConfig[], game: 'league' | 'valorant'): string[] {
  return helpers
    .filter((helper) => helper.path && helper.enabled && helper.gameBindings[game])
    .map((helper, index) =>
      getCompanionDisplayName(
        helper.path,
        helper.displayName,
        helper.detectedName || `Helper ${index + 1}`
      )
    )
}
