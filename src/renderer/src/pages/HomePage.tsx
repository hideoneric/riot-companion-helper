import type { AppState, LogEntry, Page, Settings } from '../App'
import { IconButton, SectionLabel, StatusDot, ToggleSwitch } from '../components/CommandUi'
import { getCompanionDisplayName, getCompanionInitial } from '../lib/companion-display'
import { getEntityTone } from '../lib/command-center'

interface Props {
  activePage: Page
  appState: AppState
  logs: LogEntry[]
  settings: Settings
  onSaveSettings: (s: Settings) => Promise<void>
  onNavigate: (page: Page) => void
}

const levelColor: Record<LogEntry['level'], string> = {
  info: '#c8cedb',
  warn: '#f2b84b',
  error: '#ff4058'
}

export function HomePage({
  activePage,
  appState,
  logs,
  settings,
  onSaveSettings,
  onNavigate
}: Props) {
  const companions = getCompanions(appState, settings)
  const visibleCompanions = companions.filter((companion) => companion.visible)

  if (activePage === 'activity') {
    return (
      <div className="redesign-page single-column">
        <ActivityPanel logs={logs} full />
      </div>
    )
  }

  if (activePage === 'games') {
    return (
      <div className="redesign-page single-column">
        <GameLauncher appState={appState} onNavigate={onNavigate} />
        <GameSection appState={appState} settings={settings} onSaveSettings={onSaveSettings} />
      </div>
    )
  }

  if (activePage === 'companions') {
    return (
      <div className="redesign-page single-column">
        <CompanionSection
          companions={companions}
          settings={settings}
          onSaveSettings={onSaveSettings}
          onNavigate={onNavigate}
          showHidden
        />
      </div>
    )
  }

  return (
    <div className="redesign-page dashboard-grid">
      <section className="dashboard-left">
        <GameLauncher appState={appState} onNavigate={onNavigate} />
        <GameSection appState={appState} settings={settings} onSaveSettings={onSaveSettings} />
        <CompanionSection
          companions={visibleCompanions}
          settings={settings}
          onSaveSettings={onSaveSettings}
          onNavigate={onNavigate}
        />
      </section>

      <aside className="dashboard-right">
        <SettingsCallout onNavigate={onNavigate} />
        <ActivityPanel logs={logs} onViewAll={() => onNavigate('activity')} />
      </aside>
    </div>
  )
}

function GameLauncher({
  appState,
  onNavigate
}: {
  appState: AppState
  onNavigate: (page: Page) => void
}) {
  return (
    <section className="dashboard-panel launcher-panel">
      <div className="section-heading">
        <SectionLabel>Game launcher</SectionLabel>
        <StatusPill tone={appState.leagueRunning ? 'running' : 'idle'}>
          {appState.leagueRunning ? 'League detected' : 'Waiting for games'}
        </StatusPill>
      </div>
      <div className="launcher-grid">
        <LauncherCard
          name="League of Legends"
          detail={
            appState.leagueRunning
              ? 'Running now · helper automation active'
              : 'Ready for process detection'
          }
          action={appState.leagueRunning ? 'Running' : 'Configure'}
          muted={appState.leagueRunning}
          onClick={() => onNavigate(appState.leagueRunning ? 'activity' : 'settings')}
        />
        <LauncherCard
          name="Valorant"
          detail={
            appState.valorantRunning
              ? 'Running now · helper automation active'
              : 'Ready for detection'
          }
          action={appState.valorantRunning ? 'Running' : 'Configure'}
          muted={appState.valorantRunning}
          onClick={() => onNavigate(appState.valorantRunning ? 'activity' : 'settings')}
        />
      </div>
    </section>
  )
}

function LauncherCard({
  name,
  detail,
  action,
  muted,
  onClick
}: {
  name: string
  detail: string
  action: string
  muted: boolean
  onClick: () => void
}) {
  return (
    <div className="launcher-card">
      <div>
        <h2>{name}</h2>
        <p>{detail}</p>
      </div>
      <button className={`launcher-action ${muted ? 'muted' : ''}`.trim()} onClick={onClick}>
        {action}
      </button>
    </div>
  )
}

function GameSection({
  appState,
  settings,
  onSaveSettings
}: {
  appState: AppState
  settings: Settings
  onSaveSettings: (s: Settings) => Promise<void>
}) {
  return (
    <section className="dashboard-section">
      <div className="section-heading">
        <SectionLabel>Games</SectionLabel>
        <StatusPill>
          {enabledCount(appState.leagueEnabled, appState.valorantEnabled)} enabled
        </StatusPill>
      </div>
      <div className="tile-grid">
        <GameCard
          name="League of Legends"
          running={appState.leagueRunning}
          enabled={appState.leagueEnabled}
          onToggle={() => onSaveSettings({ ...settings, leagueEnabled: !appState.leagueEnabled })}
        />
        <GameCard
          name="Valorant"
          running={appState.valorantRunning}
          enabled={appState.valorantEnabled}
          onToggle={() =>
            onSaveSettings({ ...settings, valorantEnabled: !appState.valorantEnabled })
          }
        />
      </div>
    </section>
  )
}

function GameCard({
  name,
  running,
  enabled,
  onToggle
}: {
  name: string
  running: boolean
  enabled: boolean
  onToggle: () => void
}) {
  const state = getEntityTone({ enabled, running })

  return (
    <article className="status-tile">
      <div className="tile-heading">
        <div className="tile-title">
          <div className="tile-icon">{getCompanionInitial(name)}</div>
          <div>
            <h2>{name}</h2>
            <p>Game process</p>
          </div>
        </div>
        <ToggleSwitch on={enabled} onToggle={onToggle} />
      </div>
      <p>Detection trigger for enabled companion apps.</p>
      <div className="tile-footer">
        <StatusPill tone={state.tone}>
          <StatusDot tone={state.tone} pulse={state.tone === 'running'} />
          {state.label}
        </StatusPill>
        <IconButton title={`${name} options`} onClick={() => undefined}>
          ⋯
        </IconButton>
      </div>
    </article>
  )
}

function CompanionSection({
  companions,
  settings,
  onSaveSettings,
  onNavigate,
  showHidden = false
}: {
  companions: CompanionView[]
  settings: Settings
  onSaveSettings: (s: Settings) => Promise<void>
  onNavigate: (page: Page) => void
  showHidden?: boolean
}) {
  return (
    <section className="dashboard-section">
      <div className="section-heading">
        <SectionLabel>Companions</SectionLabel>
        <StatusPill>
          {companions.length} {showHidden ? 'configured' : 'visible'}
        </StatusPill>
      </div>
      {companions.length === 0 ? (
        <div className="dashboard-panel empty-panel">
          <h2>No visible companions</h2>
          <p>Restore hidden helpers or configure paths in Settings.</p>
          <button className="launcher-action" onClick={() => onNavigate('settings')}>
            Open Settings
          </button>
        </div>
      ) : (
        <div className="companion-list">
          {companions.map((companion) => (
            <CompanionCard
              key={companion.id}
              companion={companion}
              settings={settings}
              onSaveSettings={onSaveSettings}
            />
          ))}
        </div>
      )}
    </section>
  )
}

function CompanionCard({
  companion,
  settings,
  onSaveSettings
}: {
  companion: CompanionView
  settings: Settings
  onSaveSettings: (s: Settings) => Promise<void>
}) {
  const state = getEntityTone({ enabled: companion.enabled, running: companion.running })
  const detail = companion.manualName
    ? 'Custom display name'
    : companion.pathSet
      ? `Detected from ${companion.pathKind}`
      : 'Path missing'

  return (
    <article className={`status-tile companion-tile ${!companion.visible ? 'hidden' : ''}`.trim()}>
      <div className="tile-heading">
        <div className="tile-title">
          <div className="tile-icon">{getCompanionInitial(companion.name)}</div>
          <div>
            <h2>{companion.name}</h2>
            <p>{detail}</p>
          </div>
        </div>
        <ToggleSwitch
          on={companion.enabled}
          onToggle={() =>
            onSaveSettings({ ...settings, [companion.enabledKey]: !companion.enabled })
          }
        />
      </div>
      <p>
        {companion.manualName
          ? 'Name was set manually because the detected name was unavailable or not preferred.'
          : 'Auto-detected display name. You can override the name in Settings.'}
      </p>
      <div className="tile-footer">
        <StatusPill tone={!companion.pathSet ? 'setup' : state.tone}>
          <StatusDot
            tone={!companion.pathSet ? 'setup' : state.tone}
            pulse={state.tone === 'running'}
          />
          {!companion.pathSet ? 'Path missing' : state.label}
        </StatusPill>
        <IconButton title={`Configure ${companion.name}`} onClick={() => undefined}>
          ⚙
        </IconButton>
      </div>
    </article>
  )
}

function SettingsCallout({ onNavigate }: { onNavigate: (page: Page) => void }) {
  return (
    <section className="settings-callout">
      <div>
        <h2>Quick controls moved to Settings</h2>
        <p>Dashboard keeps status, launch actions, companions, and activity.</p>
      </div>
      <button className="launcher-action muted" onClick={() => onNavigate('settings')}>
        Open Settings
      </button>
    </section>
  )
}

function ActivityPanel({
  logs,
  full = false,
  onViewAll
}: {
  logs: LogEntry[]
  full?: boolean
  onViewAll?: () => void
}) {
  const visibleLogs = full ? logs : logs.slice(0, 9)

  return (
    <section className={`dashboard-panel activity-panel ${full ? 'full' : ''}`.trim()}>
      <div className="section-heading">
        <SectionLabel>Activity</SectionLabel>
        {onViewAll && (
          <button className="pill-button" onClick={onViewAll}>
            View all
          </button>
        )}
      </div>
      <div className="activity-list">
        {visibleLogs.length === 0 ? (
          <div className="activity-empty">No activity yet</div>
        ) : (
          visibleLogs.map((entry) => (
            <div key={`${entry.timestamp}-${entry.message}`} className="activity-row">
              <time>{entry.timestamp}</time>
              <span style={{ color: levelColor[entry.level] }}>{entry.message}</span>
            </div>
          ))
        )}
      </div>
    </section>
  )
}

function StatusPill({
  tone = 'idle',
  children
}: {
  tone?: 'active' | 'setup' | 'paused' | 'running' | 'idle' | 'disabled'
  children: React.ReactNode
}) {
  return <span className={`status-pill ${tone}`.trim()}>{children}</span>
}

interface CompanionView {
  id: 'blitz' | 'porofessor'
  name: string
  manualName: string
  pathKind: string
  pathSet: boolean
  running: boolean
  enabled: boolean
  visible: boolean
  enabledKey: 'blitzEnabled' | 'porofessorEnabled'
}

function getCompanions(appState: AppState, settings: Settings): CompanionView[] {
  return [
    {
      id: 'blitz',
      name: getCompanionDisplayName(settings.blitzPath, settings.blitzName, 'Blitz.gg'),
      manualName: settings.blitzName,
      pathKind: getPathKind(settings.blitzPath),
      pathSet: appState.blitzPathSet,
      running: appState.blitzRunning,
      enabled: appState.blitzEnabled,
      visible: settings.blitzVisible,
      enabledKey: 'blitzEnabled'
    },
    {
      id: 'porofessor',
      name: getCompanionDisplayName(settings.porofessorPath, settings.porofessorName, 'Porofessor'),
      manualName: settings.porofessorName,
      pathKind: getPathKind(settings.porofessorPath),
      pathSet: appState.porofessorPathSet,
      running: appState.porofessorRunning,
      enabled: appState.porofessorEnabled,
      visible: settings.porofessorVisible,
      enabledKey: 'porofessorEnabled'
    }
  ]
}

function getPathKind(filePath: string): string {
  return filePath.toLowerCase().endsWith('.lnk')
    ? 'shortcut'
    : filePath.split(/[\\/]/).pop() || 'path'
}

function enabledCount(...items: boolean[]): number {
  return items.filter(Boolean).length
}
