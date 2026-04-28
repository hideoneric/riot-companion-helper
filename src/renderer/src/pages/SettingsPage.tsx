import { useCallback, useEffect, useState } from 'react'
import type React from 'react'
import type { HelperConfig, Settings, UpdateStatus } from '../App'
import { getCompanionDisplayName } from '../lib/companion-display'
import { bindingLabel, syncLegacyFields } from '../lib/helper-config'
import { SectionHeader, Toggle } from './HomePage'

declare const window: Window & {
  api: {
    browse: () => Promise<string | null>
  }
}

interface Props {
  settings: Settings
  updateStatus: UpdateStatus | null
  onSave: (s: Settings) => Promise<void>
  onCheckForUpdates: () => Promise<void>
}

export function SettingsPage({ settings, updateStatus, onSave, onCheckForUpdates }: Props) {
  return (
    <div className="page settings-page">
      <HelperSettings settings={settings} onSave={onSave} />
      <MonitoringSettings settings={settings} onSave={onSave} />
      <StartupSettings settings={settings} onSave={onSave} />
      <UpdateSettings updateStatus={updateStatus} onCheckForUpdates={onCheckForUpdates} />
    </div>
  )
}

function HelperSettings({ settings, onSave }: Pick<Props, 'settings' | 'onSave'>) {
  return (
    <section>
      <SectionHeader title="Helpers" note="Each helper can be bound to one or both games" />
      <div className="settings-list">
        {settings.helpers.map((helper, index) => (
          <HelperSettingRow
            key={helper.id}
            helper={helper}
            slotNumber={index + 1}
            settings={settings}
            onSave={onSave}
          />
        ))}
      </div>
    </section>
  )
}

function HelperSettingRow({
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
    if (selectedPath) {
      const nextDetectedName = getCompanionDisplayName(selectedPath, '', fallbackName)
      setPathValue(selectedPath)
      await saveHelper({
        path: selectedPath,
        detectedName: nextDetectedName,
        enabled: true,
        showOnOverview: true
      })
    }
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
    <article className={`settings-helper ${configured ? 'configured' : 'setup'}`.trim()}>
      <div className="row-icon">{configured ? 'APP' : slotNumber}</div>
      <div className="settings-helper-main">
        <div className="settings-helper-title">
          <h3>
            {configured
              ? getCompanionDisplayName(helper.path, helper.displayName, helper.detectedName)
              : `Helper slot ${slotNumber}`}
          </h3>
          <Toggle
            checked={configured && helper.enabled}
            disabled={!configured}
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
              <button className="button compact" onClick={handleBrowse}>
                Browse
              </button>
            </div>
          </label>
        </div>

        {!validPath && pathValue && (
          <div className="field-error">Path must end in .exe or .lnk</div>
        )}

        <div className="binding-row">
          <span>Bind to</span>
          <button
            className={`chip-button ${helper.gameBindings.league ? 'active' : ''}`.trim()}
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
            className={`chip-button ${helper.gameBindings.valorant ? 'active' : ''}`.trim()}
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
          <em>{bindingLabel(helper)}</em>
        </div>
      </div>
      <button className="text-button muted" onClick={handleRemove} disabled={!configured}>
        Remove
      </button>
    </article>
  )
}

function MonitoringSettings({ settings, onSave }: Pick<Props, 'settings' | 'onSave'>) {
  return (
    <section>
      <SectionHeader title="Monitoring" />
      <div className="settings-list">
        <SettingRow
          title="Watch for game processes"
          detail="Starts or stops helpers when enabled games open or close"
          control={
            <Toggle
              checked={settings.monitoringEnabled}
              onToggle={() =>
                onSave({ ...settings, monitoringEnabled: !settings.monitoringEnabled })
              }
            />
          }
        />
        <SettingRow
          title="Polling interval"
          detail="How often the app checks for League or Valorant"
          control={
            <select
              className="select"
              value={settings.pollingInterval}
              onChange={(event) =>
                onSave({ ...settings, pollingInterval: Number(event.target.value) })
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
      </div>
    </section>
  )
}

function StartupSettings({ settings, onSave }: Pick<Props, 'settings' | 'onSave'>) {
  return (
    <section>
      <SectionHeader title="Startup" />
      <div className="settings-list">
        <SettingRow
          title="Launch with Windows"
          detail="Open in the tray after sign-in"
          control={
            <Toggle
              checked={settings.launchWithWindows}
              onToggle={() =>
                onSave({ ...settings, launchWithWindows: !settings.launchWithWindows })
              }
            />
          }
        />
      </div>
    </section>
  )
}

function UpdateSettings({
  updateStatus,
  onCheckForUpdates
}: Pick<Props, 'updateStatus' | 'onCheckForUpdates'>) {
  return (
    <section>
      <SectionHeader title="Updates" />
      <div className="settings-list">
        <SettingRow
          title="GitHub releases"
          detail={updateStatusText(updateStatus)}
          control={
            <button
              className="button compact"
              onClick={onCheckForUpdates}
              disabled={updateStatus?.status === 'checking'}
            >
              {updateStatus?.status === 'checking' ? 'Checking...' : 'Check'}
            </button>
          }
        />
      </div>
    </section>
  )
}

function SettingRow({
  title,
  detail,
  control
}: {
  title: string
  detail: string
  control: React.ReactNode
}) {
  return (
    <div className="setting-row">
      <div>
        <h3>{title}</h3>
        <p>{detail}</p>
      </div>
      <div className="setting-control">{control}</div>
    </div>
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
  if (!status) return 'Check the latest GitHub release manually'
  if (status.status === 'checking') return 'Checking GitHub releases'
  if (status.status === 'available') return `Update v${status.version} is available`
  if (status.status === 'downloading') return `Downloading v${status.version}: ${status.progress}%`
  if (status.status === 'ready') return `Update v${status.version} is ready to install`
  if (status.status === 'error') return status.message
  return 'No update available'
}
