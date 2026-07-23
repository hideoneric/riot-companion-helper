import { useCallback, useEffect, useState } from 'react'
import type React from 'react'
import type { HelperConfig, Settings, UpdateStatus } from '../App'
import { getCompanionDisplayName } from '../lib/companion-display'
import { syncLegacyFields } from '../lib/helper-config'
import { Icon, SectionHeader, Toggle } from './MaterialControls'

declare const window: Window & {
  api: {
    browse: () => Promise<string | null>
    listProcesses: () => Promise<Array<{ name: string }>>
  }
}

interface Props {
  helpers: HelperConfig[]
  settings: Settings
  updateStatus: UpdateStatus | null
  inspectorRef: React.RefObject<HTMLElement | null>
  onSaveSettings: (s: Settings) => Promise<void>
  onCheckForUpdates: () => Promise<void>
  onInstallUpdate: () => void
}

export function ControlInspector({
  helpers,
  settings,
  updateStatus,
  inspectorRef,
  onSaveSettings,
  onCheckForUpdates,
  onInstallUpdate
}: Props) {
  return (
    <aside
      id="control-inspector"
      ref={inspectorRef}
      className="control-inspector"
      aria-label="Settings inspector"
      tabIndex={-1}
    >
      <div className="inspector-header">
        <div>
          <h2>Controls</h2>
          <p>Helpers, bindings, startup, updates</p>
        </div>
        <Icon name="settings" />
      </div>

      <section className="inspector-section">
        <SectionHeader icon="rocket_launch" title="Helpers" compact />
        <div className="inspector-list">
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
      </section>

      <section className="inspector-section">
        <SectionHeader icon="tune" title="System" compact />
        <div className="inspector-list">
          <SettingRow
            icon="timer"
            title="Polling"
            detail="Game process check interval"
            control={
              <select
                className="select compact-select"
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
                    {seconds}s
                  </option>
                ))}
              </select>
            }
          />
          <SettingRow
            icon="start"
            title="Startup"
            detail="Launch with Windows"
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
            icon="minimize"
            title="Start minimized"
            detail="Open minimized on app start"
            control={
              <Toggle
                checked={settings.startMinimized}
                label="Start minimized"
                onToggle={() =>
                  onSaveSettings({
                    ...settings,
                    startMinimized: !settings.startMinimized
                  })
                }
              />
            }
          />
          <SettingRow
            icon="system_update"
            title="Updates"
            detail={updateStatusText(updateStatus)}
            control={
              <button
                className="button tonal"
                onClick={updateStatus?.status === 'ready' ? onInstallUpdate : onCheckForUpdates}
                disabled={
                  updateStatus?.status === 'checking' || updateStatus?.status === 'downloading'
                }
              >
                <Icon name={updateStatus?.status === 'ready' ? 'restart_alt' : 'sync'} />
                {updateButtonText(updateStatus)}
              </button>
            }
          />
        </div>
      </section>
    </aside>
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
  const [pathValue, setPathValue] = useState(helper.path)
  const [processValue, setProcessValue] = useState(helper.processName ?? '')
  const [processes, setProcesses] = useState<Array<{ name: string }>>([])
  const [processError, setProcessError] = useState('')
  const configured = !!helper.path
  const validPath = isValidPath(pathValue)
  const fallbackName = `Helper slot ${slotNumber}`
  const detectedName = getCompanionDisplayName(pathValue, '', fallbackName)

  useEffect(() => setPathValue(helper.path), [helper.path])
  useEffect(() => setProcessValue(helper.processName ?? ''), [helper.processName])

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

  const refreshProcesses = useCallback(async () => {
    setProcessError('')
    try {
      setProcesses(await window.api.listProcesses())
    } catch (error) {
      setProcessError(error instanceof Error ? error.message : String(error))
    }
  }, [])

  const handleSaveDetails = useCallback(() => {
    if (!validPath) return
    if (pathValue === helper.path && detectedName === helper.detectedName) return

    return saveHelper({
      path: pathValue,
      detectedName,
      enabled: !!pathValue && (helper.enabled || !helper.path)
    })
  }, [
    detectedName,
    helper.detectedName,
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
        processName: '',
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

  const title = configured
    ? getCompanionDisplayName(helper.path, helper.displayName, helper.detectedName)
    : fallbackName

  return (
    <article className="helper-settings">
      <div className="helper-head">
        <div className="helper-title">
          <Icon name={configured ? 'rocket_launch' : 'add_link'} />
          <div>
            <h3>{title}</h3>
            <p>{configured ? shortPath(helper.path) : 'Choose .exe or .lnk'}</p>
          </div>
        </div>
        <Toggle
          checked={configured && helper.enabled}
          disabled={!configured}
          label={`Enable ${fallbackName}`}
          onToggle={() => saveHelper({ enabled: !helper.enabled })}
        />
      </div>

      <label>
        <span>Path</span>
        <div className="path-field">
          <input
            className={`input ${!validPath && pathValue ? 'invalid' : ''}`.trim()}
            value={pathValue}
            onChange={(event) => setPathValue(event.target.value)}
            onBlur={() => handleSaveDetails()}
            placeholder="Select executable"
            title={pathValue}
          />
          <button
            className="icon-button"
            onClick={handleBrowse}
            aria-label={`Browse ${fallbackName}`}
          >
            <Icon name="folder_open" />
          </button>
        </div>
      </label>

      {!validPath && pathValue && <div className="field-error">Path must end in .exe or .lnk.</div>}

      <label>
        <span>Process</span>
        <div className="path-field">
          <input
            className="input"
            value={processValue}
            onChange={(event) => setProcessValue(event.target.value)}
            onBlur={() => saveHelper({ processName: processValue.trim() })}
            list={`${helper.id}-processes`}
            placeholder="Helper.exe"
          />
          <button
            className="icon-button"
            onClick={refreshProcesses}
            aria-label={`Refresh process list for ${fallbackName}`}
          >
            <Icon name="sync" />
          </button>
        </div>
        <datalist id={`${helper.id}-processes`}>
          {processes.map((process) => (
            <option key={process.name} value={process.name} />
          ))}
        </datalist>
      </label>
      {processError && <div className="field-error">{processError}</div>}

      <div className="helper-footer">
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
        <button
          className="icon-button danger"
          onClick={handleRemove}
          disabled={!configured}
          aria-label={`Remove ${fallbackName}`}
        >
          <Icon name="delete" />
        </button>
      </div>
    </article>
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
    <article className="setting-row">
      <Icon name={icon} />
      <div className="setting-main">
        <h3>{title}</h3>
        <p>{detail}</p>
      </div>
      <div className="setting-control">{control}</div>
    </article>
  )
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
  if (!status) return 'Check GitHub releases'
  if (status.status === 'checking') return 'Checking GitHub releases'
  if (status.status === 'available') return `Update v${status.version} available`
  if (status.status === 'downloading') return `Downloading v${status.version}: ${status.progress}%`
  if (status.status === 'ready') return `Update v${status.version} ready`
  if (status.status === 'error') return status.message
  return 'No update available'
}

function updateButtonText(status: UpdateStatus | null): string {
  if (status?.status === 'checking') return 'Checking'
  if (status?.status === 'available') return 'Download'
  if (status?.status === 'downloading') return 'Downloading'
  if (status?.status === 'ready') return 'Restart'
  return 'Check'
}

function shortPath(filePath: string): string {
  const parts = filePath.split(/[\\/]/).filter(Boolean)
  if (parts.length <= 2) return filePath
  return `${parts[0]}\\...\\${parts[parts.length - 1]}`
}
