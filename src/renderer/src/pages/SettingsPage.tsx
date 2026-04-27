import React, { useEffect, useState } from 'react'
import type { Settings, SubPage } from '../App'
import {
  CommandCard,
  PrimaryButton,
  SecondaryButton,
  SectionLabel,
  ToggleSwitch
} from '../components/CommandUi'

declare const window: Window & {
  api: {
    browse: () => Promise<string | null>
  }
}

interface Props {
  sub: SubPage
  settings: Settings
  onSave: (s: Settings) => Promise<void>
}

const ACCENT_PRESETS = [
  '#7c5cbf',
  '#3b82f6',
  '#06b6d4',
  '#10b981',
  '#ef4444',
  '#f59e0b',
  '#ec4899',
  '#84cc16'
]

export function SettingsPage({ sub, settings, onSave }: Props) {
  return sub === 'general' ? (
    <GeneralSettings settings={settings} onSave={onSave} />
  ) : (
    <BehaviorSettings settings={settings} onSave={onSave} />
  )
}

function isValidPath(path: string): boolean {
  const normalized = path.toLowerCase()
  return !path || normalized.endsWith('.exe') || normalized.endsWith('.lnk')
}

function GeneralSettings({
  settings,
  onSave
}: {
  settings: Settings
  onSave: (s: Settings) => Promise<void>
}) {
  const [blitzPath, setBlitzPath] = useState(settings.blitzPath)
  const [porofessorPath, setPorofessorPath] = useState(settings.porofessorPath)
  const [interval, setInterval] = useState(settings.pollingInterval)
  const [savingBlitz, setSavingBlitz] = useState(false)
  const [savingPorofessor, setSavingPorofessor] = useState(false)
  const blitzPathValid = isValidPath(blitzPath)
  const porofessorPathValid = isValidPath(porofessorPath)

  useEffect(() => setBlitzPath(settings.blitzPath), [settings.blitzPath])
  useEffect(() => setPorofessorPath(settings.porofessorPath), [settings.porofessorPath])
  useEffect(() => setInterval(settings.pollingInterval), [settings.pollingInterval])

  const handleBrowseBlitz = async () => {
    const path = await window.api.browse()
    if (path) setBlitzPath(path)
  }

  const handleBrowsePorofessor = async () => {
    const path = await window.api.browse()
    if (path) setPorofessorPath(path)
  }

  const handleUpdateBlitz = async () => {
    if (!blitzPathValid) return
    setSavingBlitz(true)
    await onSave({ ...settings, blitzPath })
    setSavingBlitz(false)
  }

  const handleUpdatePorofessor = async () => {
    if (!porofessorPathValid) return
    setSavingPorofessor(true)
    await onSave({ ...settings, porofessorPath })
    setSavingPorofessor(false)
  }

  const handleUpdateInterval = async (nextInterval: number) => {
    setInterval(nextInterval)
    await onSave({ ...settings, pollingInterval: nextInterval })
  }

  return (
    <div className="settings-page">
      <PageHeader title="General" description="Configure companion paths and visual defaults." />

      <div className="settings-grid">
        <CommandCard className="settings-panel wide">
          <SectionLabel>Helpers</SectionLabel>
          <PathSetting
            label="Blitz.gg"
            detail="Shared helper for League and Valorant."
            value={blitzPath}
            valid={blitzPathValid}
            saving={savingBlitz}
            placeholder="C:\\...\\Blitz.exe"
            visible={settings.blitzVisible}
            onChange={setBlitzPath}
            onBrowse={handleBrowseBlitz}
            onUpdate={handleUpdateBlitz}
            onToggleVisible={() => onSave({ ...settings, blitzVisible: !settings.blitzVisible })}
          />

          <div className="settings-divider" />

          <PathSetting
            label="Porofessor"
            detail="League-only helper."
            value={porofessorPath}
            valid={porofessorPathValid}
            saving={savingPorofessor}
            placeholder="C:\\...\\Porofessor.exe"
            visible={settings.porofessorVisible}
            onChange={setPorofessorPath}
            onBrowse={handleBrowsePorofessor}
            onUpdate={handleUpdatePorofessor}
            onToggleVisible={() =>
              onSave({ ...settings, porofessorVisible: !settings.porofessorVisible })
            }
          />
        </CommandCard>

        <CommandCard className="settings-panel">
          <SectionLabel>Polling</SectionLabel>
          <h2>Detection interval</h2>
          <p>Shorter intervals feel more responsive and use slightly more background work.</p>
          <select
            className="cc-input select"
            value={interval}
            onChange={(event) => handleUpdateInterval(Number(event.target.value))}
          >
            {[1, 2, 3, 5, 10].map((seconds) => (
              <option key={seconds} value={seconds}>
                {seconds}s
              </option>
            ))}
          </select>
        </CommandCard>

        <CommandCard className="settings-panel">
          <AppearanceSection settings={settings} onSave={onSave} />
        </CommandCard>
      </div>
    </div>
  )
}

function BehaviorSettings({
  settings,
  onSave
}: {
  settings: Settings
  onSave: (s: Settings) => Promise<void>
}) {
  const [monitoring, setMonitoring] = useState(settings.monitoringEnabled)
  const [startup, setStartup] = useState(settings.launchWithWindows)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setMonitoring(settings.monitoringEnabled)
    setStartup(settings.launchWithWindows)
    setDirty(false)
  }, [settings.monitoringEnabled, settings.launchWithWindows])

  const toggleMonitoring = () => {
    setMonitoring((value) => !value)
    setDirty(true)
  }

  const toggleStartup = () => {
    setStartup((value) => !value)
    setDirty(true)
  }

  const handleSave = async () => {
    setSaving(true)
    await onSave({ ...settings, monitoringEnabled: monitoring, launchWithWindows: startup })
    setDirty(false)
    setSaving(false)
  }

  const handleDiscard = () => {
    setMonitoring(settings.monitoringEnabled)
    setStartup(settings.launchWithWindows)
    setDirty(false)
  }

  return (
    <div className="settings-page behavior-page">
      <PageHeader
        title="Behavior"
        description="Control when monitoring runs and how Windows starts it."
      />

      <div className="settings-grid">
        <CommandCard className="settings-panel wide">
          <SectionLabel>Startup behavior</SectionLabel>
          <SwitchRow
            title="Monitoring enabled"
            detail="Allow the app to watch enabled games and manage configured companions."
            checked={monitoring}
            onToggle={toggleMonitoring}
          />
          <div className="settings-divider" />
          <SwitchRow
            title="Launch with Windows"
            detail="Register Riot Companion Helper in the current user's startup apps."
            checked={startup}
            onToggle={toggleStartup}
          />
        </CommandCard>
      </div>

      {dirty && (
        <div className="settings-savebar">
          <span>You have unsaved behavior changes.</span>
          <div>
            <PrimaryButton onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </PrimaryButton>
            <SecondaryButton onClick={handleDiscard}>Discard</SecondaryButton>
          </div>
        </div>
      )}
    </div>
  )
}

function PageHeader({ title, description }: { title: string; description: string }) {
  return (
    <header className="page-header">
      <SectionLabel>Command settings</SectionLabel>
      <h1>{title}</h1>
      <p>{description}</p>
    </header>
  )
}

function PathSetting({
  label,
  detail,
  value,
  valid,
  saving,
  placeholder,
  visible,
  onChange,
  onBrowse,
  onUpdate,
  onToggleVisible
}: {
  label: string
  detail: string
  value: string
  valid: boolean
  saving: boolean
  placeholder: string
  visible: boolean
  onChange: (value: string) => void
  onBrowse: () => void
  onUpdate: () => void
  onToggleVisible: () => void
}) {
  return (
    <div className="path-setting">
      <div className="setting-heading">
        <div>
          <h2>{label}</h2>
          <p>{detail}</p>
        </div>
        <div className="visibility-toggle">
          <span>Show on Home</span>
          <ToggleSwitch on={visible} onToggle={onToggleVisible} />
        </div>
      </div>

      <div className="path-row">
        <input
          className={`cc-input ${!valid && value ? 'invalid' : ''}`.trim()}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
        />
        <SecondaryButton onClick={onBrowse}>Browse</SecondaryButton>
        <PrimaryButton onClick={onUpdate} disabled={!valid || saving}>
          {saving ? 'Saving...' : 'Update'}
        </PrimaryButton>
      </div>
      {!valid && value && <div className="field-error">Must be a .exe or .lnk file</div>}
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

function AppearanceSection({
  settings,
  onSave
}: {
  settings: Settings
  onSave: (s: Settings) => Promise<void>
}) {
  const colorInputRef = React.useRef<HTMLInputElement>(null)
  const isCustom = !ACCENT_PRESETS.includes(settings.themeColor)

  return (
    <>
      <SectionLabel>Appearance</SectionLabel>
      <h2>Accent color</h2>
      <p>Used for active navigation, ready state, buttons, and enabled toggles.</p>
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
    </>
  )
}
