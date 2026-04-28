import type { AppState, HelperConfig, LogEntry, Page, Settings } from '../App'
import { getCompanionDisplayName } from '../lib/companion-display'
import { bindingLabel, syncLegacyFields } from '../lib/helper-config'

interface Props {
  appState: AppState
  logs: LogEntry[]
  settings: Settings
  onSaveSettings: (s: Settings) => Promise<void>
  onNavigate: (page: Page) => void
}

const levelClass: Record<LogEntry['level'], string> = {
  info: 'info',
  warn: 'setup',
  error: 'error'
}

export function HomePage({ appState, logs, settings, onSaveSettings, onNavigate }: Props) {
  const helpers = settings.helpers.filter((helper) => helper.showOnOverview)

  return (
    <div className="page overview-page">
      <SectionHeader title="Games" note="Controls decide which games can trigger helpers" />
      <div className="game-grid">
        <GameRow
          icon="LoL"
          name="League of Legends"
          running={appState.leagueRunning}
          enabled={settings.leagueEnabled}
          onToggle={() => onSaveSettings({ ...settings, leagueEnabled: !settings.leagueEnabled })}
        />
        <GameRow
          icon="VAL"
          name="Valorant"
          running={appState.valorantRunning}
          enabled={settings.valorantEnabled}
          onToggle={() =>
            onSaveSettings({ ...settings, valorantEnabled: !settings.valorantEnabled })
          }
        />
      </div>

      <SectionHeader title="Helpers" note="Configure what launches when a bound game is detected" />
      <div className="row-list">
        {helpers.map((helper, index) => {
          const running =
            helper.id === 'helper-1' ? appState.blitzRunning : appState.porofessorRunning

          return (
            <HelperRow
              key={helper.id}
              helper={helper}
              slotNumber={index + 1}
              running={running}
              onConfigure={() => onNavigate('settings')}
              onToggle={() => toggleHelper(settings, helper.id, onSaveSettings)}
            />
          )
        })}
      </div>

      <SectionHeader title="Recent activity" />
      <ActivityList logs={logs.slice(0, 8)} />
    </div>
  )
}

export function SectionHeader({ title, note }: { title: string; note?: string }) {
  return (
    <div className="section-header">
      <h2>{title}</h2>
      {note && <p>{note}</p>}
    </div>
  )
}

function GameRow({
  icon,
  name,
  running,
  enabled,
  onToggle
}: {
  icon: string
  name: string
  running: boolean
  enabled: boolean
  onToggle: () => void
}) {
  return (
    <article className={`utility-row game-row ${running ? 'running' : ''}`.trim()}>
      <div className="row-icon game-icon">{icon}</div>
      <div className="row-main">
        <h3>{name}</h3>
        <p className={running ? 'state-running' : ''}>{running ? 'Running' : 'Idle'}</p>
      </div>
      <div className="row-actions compact-actions">
        <Toggle checked={enabled} onToggle={onToggle} />
      </div>
    </article>
  )
}

function HelperRow({
  helper,
  slotNumber,
  running,
  onConfigure,
  onToggle
}: {
  helper: HelperConfig
  slotNumber: number
  running: boolean
  onConfigure: () => void
  onToggle: () => void
}) {
  const configured = !!helper.path
  const name = configured
    ? getCompanionDisplayName(
        helper.path,
        helper.displayName,
        helper.detectedName || `Helper slot ${slotNumber}`
      )
    : `Helper slot ${slotNumber}`
  const needsSetup = !configured
  const rowClass = `utility-row helper-row ${running ? 'running' : ''} ${needsSetup ? 'setup' : ''}`

  return (
    <article className={rowClass.trim()}>
      <div className="row-icon">{configured ? 'APP' : slotNumber}</div>
      <div className="row-main">
        <h3>{name}</h3>
        {configured ? (
          <div className="meta-chips">
            <span>{bindingLabel(helper)}</span>
            <span className={running ? 'state-running' : ''}>{running ? 'Running' : 'Idle'}</span>
            <em title={helper.path}>{shortPath(helper.path)}</em>
          </div>
        ) : (
          <p className="state-setup">Needs path</p>
        )}
      </div>
      <div className="row-actions">
        <button className="button compact" onClick={onConfigure}>
          {configured ? 'Configure' : 'Set path'}
        </button>
        <Toggle checked={configured && helper.enabled} disabled={!configured} onToggle={onToggle} />
      </div>
    </article>
  )
}

export function Toggle({
  checked,
  disabled = false,
  onToggle
}: {
  checked: boolean
  disabled?: boolean
  onToggle: () => void
}) {
  return (
    <button
      className={`toggle ${checked ? 'checked' : ''}`.trim()}
      disabled={disabled}
      onClick={onToggle}
      aria-pressed={checked}
    >
      <span>{checked ? 'On' : 'Off'}</span>
      <i />
    </button>
  )
}

function ActivityList({ logs }: { logs: LogEntry[] }) {
  return (
    <section className="activity-list">
      {logs.length === 0 ? (
        <div className="activity-empty">No activity yet</div>
      ) : (
        logs.map((entry) => (
          <div key={`${entry.timestamp}-${entry.message}`} className="activity-row">
            <time>{entry.timestamp}</time>
            <span className={levelClass[entry.level]}>{entry.message}</span>
          </div>
        ))
      )}
    </section>
  )
}

function toggleHelper(
  settings: Settings,
  helperId: string,
  onSaveSettings: (s: Settings) => Promise<void>
) {
  const helpers = settings.helpers.map((helper) =>
    helper.id === helperId ? { ...helper, enabled: !helper.enabled } : helper
  )
  return onSaveSettings(syncLegacyFields({ ...settings, helpers }))
}

function shortPath(filePath: string): string {
  const parts = filePath.split(/[\\/]/).filter(Boolean)
  if (parts.length <= 2) return filePath
  return `${parts[0]}\\...\\${parts[parts.length - 1]}`
}
