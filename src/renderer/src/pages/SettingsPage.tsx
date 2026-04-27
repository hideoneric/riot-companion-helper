import React, { useEffect, useState } from 'react'
import type { Settings } from '../App'
import { PrimaryButton, SecondaryButton, SectionLabel, ToggleSwitch } from '../components/CommandUi'
import { getCompanionDisplayName } from '../lib/companion-display'

declare const window: Window & {
  api: {
    browse: () => Promise<string | null>
  }
}

interface Props {
  settings: Settings
  onSave: (s: Settings) => Promise<void>
}

const ACCENT_PRESETS = [
  '#ff4058',
  '#ef4444',
  '#f59e0b',
  '#10b981',
  '#06b6d4',
  '#3b82f6',
  '#7c5cbf',
  '#ec4899'
]

export function SettingsPage({ settings, onSave }: Props) {
  return (
    <div className="settings-redesign">
      <header className="settings-header">
        <SectionLabel>Settings</SectionLabel>
        <h1>Control how helpers launch, appear, and behave.</h1>
      </header>

      <div className="settings-layout">
        <section className="settings-column wide">
          <CompanionSettings settings={settings} onSave={onSave} />
        </section>

        <section className="settings-column">
          <BehaviorSettings settings={settings} onSave={onSave} />
          <PollingSettings settings={settings} onSave={onSave} />
          <AppearanceSettings settings={settings} onSave={onSave} />
        </section>
      </div>
    </div>
  )
}

function CompanionSettings({ settings, onSave }: Props) {
  return (
    <div className="settings-panel-redesign">
      <SectionLabel>Companions</SectionLabel>
      <PathSetting
        label="Blitz.gg"
        detail="Shared helper for League and Valorant."
        value={settings.blitzPath}
        displayName={settings.blitzName}
        fallbackName="Blitz.gg"
        visible={settings.blitzVisible}
        enabled={settings.blitzEnabled}
        onSave={(next) => onSave({ ...settings, ...next })}
      />
      <div className="settings-divider" />
      <PathSetting
        label="Porofessor"
        detail="League-only helper."
        value={settings.porofessorPath}
        displayName={settings.porofessorName}
        fallbackName="Porofessor"
        visible={settings.porofessorVisible}
        enabled={settings.porofessorEnabled}
        onSave={(next) => onSave({ ...settings, ...next })}
        porofessor
      />
    </div>
  )
}

function isValidPath(path: string): boolean {
  const normalized = path.toLowerCase()
  return !path || normalized.endsWith('.exe') || normalized.endsWith('.lnk')
}

function PathSetting({
  label,
  detail,
  value,
  displayName,
  fallbackName,
  visible,
  enabled,
  onSave,
  porofessor = false
}: {
  label: string
  detail: string
  value: string
  displayName: string
  fallbackName: string
  visible: boolean
  enabled: boolean
  onSave: (settings: Partial<Settings>) => Promise<void>
  porofessor?: boolean
}) {
  const [pathValue, setPathValue] = useState(value)
  const [nameValue, setNameValue] = useState(displayName)
  const [saving, setSaving] = useState(false)
  const pathValid = isValidPath(pathValue)
  const detectedName = getCompanionDisplayName(pathValue, '', fallbackName)

  useEffect(() => setPathValue(value), [value])
  useEffect(() => setNameValue(displayName), [displayName])

  const pathKey = porofessor ? 'porofessorPath' : 'blitzPath'
  const nameKey = porofessor ? 'porofessorName' : 'blitzName'
  const visibleKey = porofessor ? 'porofessorVisible' : 'blitzVisible'
  const enabledKey = porofessor ? 'porofessorEnabled' : 'blitzEnabled'

  const handleBrowse = async () => {
    const selectedPath = await window.api.browse()
    if (selectedPath) setPathValue(selectedPath)
  }

  const handleUpdate = async () => {
    if (!pathValid) return
    setSaving(true)
    await onSave({ [pathKey]: pathValue, [nameKey]: nameValue } as Partial<Settings>)
    setSaving(false)
  }

  return (
    <div className="path-setting-redesign">
      <div className="setting-heading">
        <div>
          <h2>{label}</h2>
          <p>{detail}</p>
        </div>
        <div className="setting-toggles">
          <span>Enabled</span>
          <ToggleSwitch
            on={enabled}
            onToggle={() => onSave({ [enabledKey]: !enabled } as Partial<Settings>)}
          />
          <span>Visible</span>
          <ToggleSwitch
            on={visible}
            onToggle={() => onSave({ [visibleKey]: !visible } as Partial<Settings>)}
          />
        </div>
      </div>

      <label>
        <span>Display name</span>
        <input
          className="cc-input"
          value={nameValue}
          onChange={(event) => setNameValue(event.target.value)}
          placeholder={detectedName}
        />
      </label>
      <p className="detected-name">Auto-detected fallback: {detectedName}</p>

      <label>
        <span>Path</span>
        <div className="path-row">
          <input
            className={`cc-input ${!pathValid && pathValue ? 'invalid' : ''}`.trim()}
            value={pathValue}
            onChange={(event) => setPathValue(event.target.value)}
            placeholder="C:\..."
          />
          <SecondaryButton onClick={handleBrowse}>Browse</SecondaryButton>
          <PrimaryButton onClick={handleUpdate} disabled={!pathValid || saving}>
            {saving ? 'Saving...' : 'Update'}
          </PrimaryButton>
        </div>
      </label>
      {!pathValid && pathValue && <div className="field-error">Must be a .exe or .lnk file</div>}
    </div>
  )
}

function BehaviorSettings({ settings, onSave }: Props) {
  return (
    <div className="settings-panel-redesign">
      <SectionLabel>Behavior</SectionLabel>
      <SwitchRow
        title="Monitoring"
        detail="Watch enabled games and manage configured helpers."
        checked={settings.monitoringEnabled}
        onToggle={() => onSave({ ...settings, monitoringEnabled: !settings.monitoringEnabled })}
      />
      <div className="settings-divider" />
      <SwitchRow
        title="Launch with Windows"
        detail="Register the app in the current user's startup apps."
        checked={settings.launchWithWindows}
        onToggle={() => onSave({ ...settings, launchWithWindows: !settings.launchWithWindows })}
      />
    </div>
  )
}

function PollingSettings({ settings, onSave }: Props) {
  return (
    <div className="settings-panel-redesign">
      <SectionLabel>Polling</SectionLabel>
      <h2>Detection interval</h2>
      <p>Shorter intervals feel more responsive and use slightly more background work.</p>
      <div className="segmented-control">
        {[1, 2, 3, 5, 10].map((seconds) => (
          <button
            key={seconds}
            className={settings.pollingInterval === seconds ? 'active' : ''}
            onClick={() => onSave({ ...settings, pollingInterval: seconds })}
          >
            {seconds}s
          </button>
        ))}
      </div>
    </div>
  )
}

function AppearanceSettings({ settings, onSave }: Props) {
  const colorInputRef = React.useRef<HTMLInputElement>(null)
  const isCustom = !ACCENT_PRESETS.includes(settings.themeColor)

  return (
    <div className="settings-panel-redesign">
      <SectionLabel>Appearance</SectionLabel>
      <h2>Accent color</h2>
      <p>Used for active tabs, buttons, and enabled toggles.</p>
      <div className="swatch-row">
        {ACCENT_PRESETS.map((color) => (
          <button
            key={color}
            className={`swatch ${settings.themeColor === color ? 'active' : ''}`.trim()}
            style={{ background: color }}
            title={color}
            aria-label={`Use accent ${color}`}
            onClick={() => onSave({ ...settings, themeColor: color })}
          />
        ))}
        <button
          className={`swatch custom ${isCustom ? 'active' : ''}`.trim()}
          title="Custom color"
          aria-label="Choose custom color"
          onClick={() => colorInputRef.current?.click()}
        />
        <input
          ref={colorInputRef}
          type="color"
          value={settings.themeColor}
          onChange={(event) => onSave({ ...settings, themeColor: event.target.value })}
        />
      </div>
    </div>
  )
}

function SwitchRow({
  title,
  detail,
  checked,
  onToggle
}: {
  title: string
  detail: string
  checked: boolean
  onToggle: () => void
}) {
  return (
    <div className="switch-row">
      <div>
        <h2>{title}</h2>
        <p>{detail}</p>
      </div>
      <ToggleSwitch on={checked} onToggle={onToggle} />
    </div>
  )
}
