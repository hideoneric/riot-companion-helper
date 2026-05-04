import { useCallback, useEffect, useMemo, useState } from 'react'
import type React from 'react'
import type { AppState, HelperConfig, LogEntry, Settings, UpdateStatus } from '../App'
import { getCompanionDisplayName } from '../lib/companion-display'
import { bindingLabel, syncLegacyFields } from '../lib/helper-config'
import { getEntityTone, getReadiness } from '../lib/command-center'

declare const window: Window & {
  api: {
    browse: () => Promise<string | null>
  }
}

interface Props {
  appState: AppState
  logs: LogEntry[]
  settings: Settings
  updateStatus: UpdateStatus | null
  onSaveSettings: (s: Settings) => Promise<void>
  onCheckForUpdates: () => Promise<void>
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
  onSaveSettings,
  onCheckForUpdates
}: Props) {
  const visibleLogs = useMemo(() => logs.slice(0, 8), [logs])
  const helpers = settings.helpers
  const hasHelper = helpers.some((helper) => helper.path)
  const readiness = getReadiness({
    pathConfigured: hasHelper,
    monitoringEnabled: settings.monitoringEnabled
  })

  return (
    <div className="page dashboard-page">
      <section className={`status-card tone-${readiness.tone}`}>
        <div className="status-copy">
          <div className="status-kicker">
            <Icon name="monitor_heart" />
            <span>{readiness.label}</span>
          </div>
          <h1>Riot Companion Helper</h1>
          <p>{readiness.description}</p>
        </div>
        <div className="status-actions">
          <Toggle
            checked={settings.monitoringEnabled}
            label="Monitoring"
            onToggle={() =>
              onSaveSettings({ ...settings, monitoringEnabled: !settings.monitoringEnabled })
            }
          />
        </div>
      </section>

      <section className="dashboard-grid">
        <div className="dashboard-stack">
          <SectionHeader icon="sports_esports" title="Games" />
          <div className="card-grid two">
            <GameCard
              icon="sports_esports"
              name="League of Legends"
              running={appState.leagueRunning}
              enabled={settings.leagueEnabled}
              onToggle={() =>
                onSaveSettings({ ...settings, leagueEnabled: !settings.leagueEnabled })
              }
            />
            <GameCard
              icon="target"
              name="Valorant"
              running={appState.valorantRunning}
              enabled={settings.valorantEnabled}
              onToggle={() =>
                onSaveSettings({ ...settings, valorantEnabled: !settings.valorantEnabled })
              }
            />
          </div>

          <SectionHeader icon="apps" title="Helpers" />
          <div className="card-list">
            {helpers.map((helper, index) => {
              const running =
                helper.id === 'helper-1' ? appState.blitzRunning : appState.porofessorRunning

              return (
                <HelperOverviewCard
                  key={helper.id}
                  helper={helper}
                  slotNumber={index + 1}
                  running={running}
                  onConfigure={() =>
                    document
                      .getElementById(`helper-settings-${helper.id}`)
                      ?.scrollIntoView({ block: 'center' })
                  }
                  onToggle={() => toggleHelper(settings, helper.id, onSaveSettings)}
                />
              )
            })}
          </div>
        </div>

        <aside className="dashboard-stack">
          <SectionHeader icon="history" title="Recent activity" />
          <ActivityList logs={visibleLogs} />
        </aside>
      </section>

      <section id="settings-panel" className="settings-surface">
        <SectionHeader icon="tune" title="Settings" />
        <div className="settings-layout">
          <div className="settings-column">
            <SectionHeader icon="apps" title="Helper setup" compact />
            <div className="card-list">
              {helpers.map((helper, index) => (
                <HelperSettingsCard
                  key={helper.id}
                  helper={helper}
                  slotNumber={index + 1}
                  settings={settings}
                  onSave={onSaveSettings}
                />
              ))}
            </div>
          </div>

          <div className="settings-column">
            <SectionHeader icon="settings" title="Monitoring" compact />
            <div className="card-list">
              <SettingRow
                icon="visibility"
                title="Watch for game processes"
                detail="Start or stop helpers when enabled games open or close."
                control={
                  <Toggle
                    checked={settings.monitoringEnabled}
                    label="Monitoring"
                    onToggle={() =>
                      onSaveSettings({
                        ...settings,
                        monitoringEnabled: !settings.monitoringEnabled
                      })
                    }
                  />
                }
              />
              <SettingRow
                icon="timer"
                title="Polling interval"
                detail="How often the app checks for League or Valorant."
                control={
                  <select
                    className="select"
                    value={settings.pollingInterval}
                    onChange={(event) =>
                      onSaveSettings({
                        ...settings,
                        pollingInterval: Number(event.target.value)
                      })
                    }
                  >
                    {[1, 2, 3, 5, 10].map((seconds) => (
                      <option key={seconds} value={seconds}>
                        {seconds} seconds
                      </option>
                    ))}
                  </select>
                }
              />
              <SettingRow
                icon="start"
                title="Launch with Windows"
                detail="Open in the tray after sign-in."
                control={
                  <Toggle
                    checked={settings.launchWithWindows}
                    label="Startup"
                    onToggle={() =>
                      onSaveSettings({
                        ...settings,
                        launchWithWindows: !settings.launchWithWindows
                      })
                    }
                  />
                }
              />
              <SettingRow
                icon="system_update"
                title="GitHub releases"
                detail={updateStatusText(updateStatus)}
                control={
                  <button
                    className="button tonal"
                    onClick={onCheckForUpdates}
                    disabled={updateStatus?.status === 'checking'}
                  >
                    <Icon name="sync" />
                    {updateStatus?.status === 'checking' ? 'Checking' : 'Check'}
                  </button>
                }
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export function SectionHeader({
  icon,
  title,
  note,
  compact = false
}: {
  icon?: string
  title: string
  note?: string
  compact?: boolean
}) {
  return (
    <div className={`section-header ${compact ? 'compact' : ''}`.trim()}>
      {icon && <Icon name={icon} />}
      <h2>{title}</h2>
      {note && <p>{note}</p>}
    </div>
  )
}

function GameCard({
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
  const state = getEntityTone({ enabled, running })

  return (
    <article className={`m3-card entity-card tone-${state.tone}`.trim()}>
      <div className="entity-leading">
        <Icon name={icon} />
      </div>
      <div className="entity-main">
        <h3>{name}</h3>
        <StatusPill tone={state.tone}>{state.label}</StatusPill>
      </div>
      <Toggle checked={enabled} label={name} onToggle={onToggle} />
    </article>
  )
}

function HelperOverviewCard({
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
  const state = getEntityTone({ enabled: configured && helper.enabled, running })
  const name = configured
    ? getCompanionDisplayName(
        helper.path,
        helper.displayName,
        helper.detectedName || `Helper slot ${slotNumber}`
      )
    : `Helper slot ${slotNumber}`

  return (
    <article className={`m3-card helper-card tone-${configured ? state.tone : 'setup'}`.trim()}>
      <div className="entity-leading">
        <Icon name={configured ? 'rocket_launch' : 'add_link'} />
      </div>
      <div className="entity-main">
        <h3>{name}</h3>
        {configured ? (
          <div className="helper-meta">
            <StatusPill tone={state.tone}>{state.label}</StatusPill>
            <span>{bindingLabel(helper)}</span>
            <em title={helper.path}>{shortPath(helper.path)}</em>
          </div>
        ) : (
          <StatusPill tone="setup">Needs path</StatusPill>
        )}
      </div>
      <div className="entity-actions">
        <button className="button tonal" onClick={onConfigure}>
          <Icon name={configured ? 'tune' : 'folder_open'} />
          {configured ? 'Configure' : 'Set path'}
        </button>
        <Toggle
          checked={configured && helper.enabled}
          disabled={!configured}
          label={name}
          onToggle={onToggle}
        />
      </div>
    </article>
  )
}

function HelperSettingsCard({
  helper,
  slotNumber,
  settings,
  onSave
}: {
  helper: HelperConfig
  slotNumber: number
  settings: Settings
  onSave: (s: Settings) => Promise<void>
}) {
  const [displayName, setDisplayName] = useState(helper.displayName)
  const [pathValue, setPathValue] = useState(helper.path)
  const configured = !!helper.path
  const validPath = isValidPath(pathValue)
  const fallbackName = `Helper slot ${slotNumber}`
  const detectedName = getCompanionDisplayName(pathValue, '', fallbackName)

  useEffect(() => setDisplayName(helper.displayName), [helper.displayName])
  useEffect(() => setPathValue(helper.path), [helper.path])

  const saveHelper = useCallback(
    (patch: Partial<HelperConfig>) => {
      const current = settings.helpers.find((item) => item.id === helper.id)
      if (current && helperPatchIsNoop(current, patch)) return Promise.resolve()

      const helpers = settings.helpers.map((item) =>
        item.id === helper.id ? { ...item, ...patch } : item
      )
      return onSave(syncLegacyFields({ ...settings, helpers }))
    },
    [helper.id, onSave, settings]
  )

  const handleBrowse = useCallback(async () => {
    const selectedPath = await window.api.browse()
    if (!selectedPath) return

    setPathValue(selectedPath)
    await saveHelper({
      path: selectedPath,
      detectedName: getCompanionDisplayName(selectedPath, '', fallbackName),
      enabled: true,
      showOnOverview: true
    })
  }, [fallbackName, saveHelper])

  const handleSaveDetails = useCallback(() => {
    if (!validPath) return
    if (
      pathValue === helper.path &&
      displayName === helper.displayName &&
      detectedName === helper.detectedName
    ) {
      return
    }

    return saveHelper({
      path: pathValue,
      displayName,
      detectedName,
      enabled: !!pathValue && (helper.enabled || !helper.path)
    })
  }, [
    detectedName,
    displayName,
    helper.detectedName,
    helper.displayName,
    helper.enabled,
    helper.path,
    pathValue,
    saveHelper,
    validPath
  ])

  const handleRemove = useCallback(
    () =>
      saveHelper({
        path: '',
        displayName: '',
        detectedName: '',
        enabled: false,
        gameBindings:
          helper.id === 'helper-1'
            ? { league: true, valorant: true }
            : { league: true, valorant: false },
        showOnOverview: true
      }),
    [helper.id, saveHelper]
  )

  return (
    <article
      id={`helper-settings-${helper.id}`}
      className={`m3-card helper-settings ${configured ? 'configured' : 'setup'}`.trim()}
    >
      <div className="settings-card-header">
        <div className="entity-leading">
          <Icon name={configured ? 'rocket_launch' : 'add_link'} />
        </div>
        <div>
          <h3>
            {configured
              ? getCompanionDisplayName(helper.path, helper.displayName, helper.detectedName)
              : `Helper slot ${slotNumber}`}
          </h3>
          <p>{configured ? bindingLabel(helper) : 'Choose an executable or shortcut.'}</p>
        </div>
        <Toggle
          checked={configured && helper.enabled}
          disabled={!configured}
          label={`Enable ${fallbackName}`}
          onToggle={() => saveHelper({ enabled: !helper.enabled })}
        />
      </div>

      <div className="field-grid">
        <label>
          <span>Display name</span>
          <input
            className="input"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            onBlur={() => handleSaveDetails()}
            placeholder={detectedName}
          />
        </label>
        <label>
          <span>Path</span>
          <div className="path-field">
            <input
              className={`input ${!validPath && pathValue ? 'invalid' : ''}`.trim()}
              value={pathValue}
              onChange={(event) => setPathValue(event.target.value)}
              onBlur={() => handleSaveDetails()}
              placeholder="Select a .exe or .lnk"
            />
            <button className="button tonal" onClick={handleBrowse}>
              <Icon name="folder_open" />
              Browse
            </button>
          </div>
        </label>
      </div>

      {!validPath && pathValue && <div className="field-error">Path must end in .exe or .lnk.</div>}

      <div className="settings-card-footer">
        <div className="segmented-control" aria-label={`Game bindings for ${fallbackName}`}>
          <button
            className={helper.gameBindings.league ? 'active' : ''}
            onClick={() =>
              saveHelper({
                gameBindings: {
                  ...helper.gameBindings,
                  league: !helper.gameBindings.league
                }
              })
            }
          >
            League
          </button>
          <button
            className={helper.gameBindings.valorant ? 'active' : ''}
            onClick={() =>
              saveHelper({
                gameBindings: {
                  ...helper.gameBindings,
                  valorant: !helper.gameBindings.valorant
                }
              })
            }
          >
            Valorant
          </button>
        </div>
        <button className="button text danger" onClick={handleRemove} disabled={!configured}>
          <Icon name="delete" />
          Remove
        </button>
      </div>
    </article>
  )
}

function ActivityList({ logs }: { logs: LogEntry[] }) {
  return (
    <section className="activity-list">
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
    </section>
  )
}

function SettingRow({
  icon,
  title,
  detail,
  control
}: {
  icon: string
  title: string
  detail: string
  control: React.ReactNode
}) {
  return (
    <article className="m3-card setting-row">
      <div className="entity-leading">
        <Icon name={icon} />
      </div>
      <div className="entity-main">
        <h3>{title}</h3>
        <p>{detail}</p>
      </div>
      <div className="setting-control">{control}</div>
    </article>
  )
}

export function Toggle({
  checked,
  disabled = false,
  label = 'Toggle',
  onToggle
}: {
  checked: boolean
  disabled?: boolean
  label?: string
  onToggle: () => void
}) {
  return (
    <button
      className={`switch ${checked ? 'checked' : ''}`.trim()}
      disabled={disabled}
      onClick={onToggle}
      aria-label={label}
      aria-pressed={checked}
    >
      <span>{checked ? 'On' : 'Off'}</span>
      <i />
    </button>
  )
}

function StatusPill({
  tone,
  children
}: {
  tone: 'active' | 'paused' | 'setup' | 'running' | 'idle' | 'disabled'
  children: React.ReactNode
}) {
  return <span className={`status-pill tone-${tone}`}>{children}</span>
}

function Icon({ name }: { name: string }) {
  return (
    <span className="material-symbols-rounded icon" aria-hidden="true">
      {name}
    </span>
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

function isValidPath(path: string): boolean {
  const normalized = path.toLowerCase()
  return !path || normalized.endsWith('.exe') || normalized.endsWith('.lnk')
}

function helperPatchIsNoop(helper: HelperConfig, patch: Partial<HelperConfig>): boolean {
  return Object.entries(patch).every(([key, value]) => {
    const helperValue = helper[key as keyof HelperConfig]

    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(helperValue) === JSON.stringify(value)
    }

    return helperValue === value
  })
}

function updateStatusText(status: UpdateStatus | null): string {
  if (!status) return 'Check the latest GitHub release manually.'
  if (status.status === 'checking') return 'Checking GitHub releases.'
  if (status.status === 'available') return `Update v${status.version} is available.`
  if (status.status === 'downloading') return `Downloading v${status.version}: ${status.progress}%.`
  if (status.status === 'ready') return `Update v${status.version} is ready to install.`
  if (status.status === 'error') return status.message
  return 'No update available.'
}

function shortPath(filePath: string): string {
  const parts = filePath.split(/[\\/]/).filter(Boolean)
  if (parts.length <= 2) return filePath
  return `${parts[0]}\\...\\${parts[parts.length - 1]}`
}
