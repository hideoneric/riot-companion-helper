import React, { useEffect, useState } from 'react'
import type { HelperSlotSettings, ProcessOption, Settings, SubPage } from '../App'

declare const window: Window & {
  api: {
    browse: () => Promise<string | null>
    listProcesses: () => Promise<ProcessOption[]>
  }
}

interface Props {
  sub: SubPage
  settings: Settings
  onSave: (s: Settings) => Promise<void>
}

export function SettingsPage({ sub, settings, onSave }: Props): React.JSX.Element {
  return sub === 'general' ? (
    <GeneralSettings settings={settings} onSave={onSave} />
  ) : (
    <BehaviorSettings settings={settings} onSave={onSave} />
  )
}

function isValidPath(p: string): boolean {
  return !p || p.toLowerCase().endsWith('.exe') || p.toLowerCase().endsWith('.lnk')
}

function GeneralSettings({
  settings,
  onSave
}: {
  settings: Settings
  onSave: (s: Settings) => Promise<void>
}): React.JSX.Element {
  const [processes, setProcesses] = useState<ProcessOption[]>([])
  const [loadingProcesses, setLoadingProcesses] = useState(false)

  const refreshProcesses = async (): Promise<void> => {
    setLoadingProcesses(true)
    try {
      setProcesses(await window.api.listProcesses())
    } finally {
      setLoadingProcesses(false)
    }
  }

  useEffect(() => {
    refreshProcesses().catch(console.error)
  }, [])

  const handleUpdateInterval = async (v: number): Promise<void> => {
    await onSave({ ...settings, pollingInterval: v })
  }

  return (
    <div style={{ padding: '32px 36px', flex: 1, overflowY: 'auto' }}>
      <PageHeading>General</PageHeading>

      <SectionHeading>Helpers</SectionHeading>
      <HelperSlotEditor
        title="League helper"
        helper={settings.leagueHelper}
        processes={processes}
        loadingProcesses={loadingProcesses}
        onRefreshProcesses={refreshProcesses}
        onChange={(leagueHelper) => onSave({ ...settings, leagueHelper })}
      />

      <div style={{ height: 1, background: '#2c2c32', margin: '20px 0' }} />

      <HelperSlotEditor
        title="Valorant helper"
        helper={settings.valorantHelper}
        processes={processes}
        loadingProcesses={loadingProcesses}
        onRefreshProcesses={refreshProcesses}
        onChange={(valorantHelper) => onSave({ ...settings, valorantHelper })}
      />

      <div style={{ height: 1, background: '#2c2c32', margin: '20px 0' }} />

      <SectionHeading>App</SectionHeading>

      <SettingRow label="Polling interval">
        <select
          value={settings.pollingInterval}
          onChange={(e) => handleUpdateInterval(Number(e.target.value))}
          style={{
            background: '#28282d',
            border: '1px solid #3a3a3e',
            borderRadius: 6,
            padding: '6px 10px',
            color: '#ffffff',
            fontSize: 12,
            cursor: 'pointer',
            outline: 'none'
          }}
        >
          {[1, 2, 3, 5, 10].map((s) => (
            <option key={s} value={s}>
              {s}s
            </option>
          ))}
        </select>
      </SettingRow>

      <div style={{ height: 1, background: '#2c2c32', margin: '20px 0' }} />
      <AppearanceSection settings={settings} onSave={onSave} />
    </div>
  )
}

function HelperSlotEditor({
  title,
  helper,
  processes,
  loadingProcesses,
  onRefreshProcesses,
  onChange
}: {
  title: string
  helper: HelperSlotSettings
  processes: ProcessOption[]
  loadingProcesses: boolean
  onRefreshProcesses: () => Promise<void>
  onChange: (helper: HelperSlotSettings) => Promise<void>
}): React.JSX.Element {
  const [appPath, setAppPath] = useState(helper.appPath)
  const [processName, setProcessName] = useState(helper.processName)
  const [savingPath, setSavingPath] = useState(false)
  const [savingProcess, setSavingProcess] = useState(false)
  const pathValid = isValidPath(appPath)

  const handleBrowse = async (): Promise<void> => {
    const p = await window.api.browse()
    if (p) setAppPath(p)
  }

  const savePath = async (): Promise<void> => {
    if (!pathValid) return
    setSavingPath(true)
    await onChange({ ...helper, appPath })
    setSavingPath(false)
  }

  const saveProcess = async (): Promise<void> => {
    setSavingProcess(true)
    await onChange({ ...helper, processName: processName.trim() })
    setSavingProcess(false)
  }

  return (
    <div>
      <h3 style={{ fontSize: 13, color: '#d0d0d8', margin: '0 0 12px' }}>{title}</h3>

      <SettingRow label="Application path">
        <div style={{ display: 'flex', gap: 8, flex: 1, maxWidth: 560 }}>
          <input
            value={appPath}
            onChange={(e) => setAppPath(e.target.value)}
            placeholder="C:\...\Helper.exe"
            style={{
              flex: 1,
              background: '#28282d',
              border: `1px solid ${pathValid ? '#3a3a3e' : '#c0392b'}`,
              borderRadius: 6,
              padding: '6px 10px',
              color: '#ffffff',
              fontSize: 12,
              outline: 'none',
              minWidth: 0
            }}
          />
          <OutlinedButton onClick={savePath} disabled={!pathValid || savingPath}>
            {savingPath ? 'Saving...' : 'Update'}
          </OutlinedButton>
        </div>
        {!pathValid && appPath && (
          <div style={{ fontSize: 11, color: '#c0392b', marginTop: 5 }}>
            Must be a .exe or .lnk file
          </div>
        )}
        <MutedButton onClick={handleBrowse}>Browse...</MutedButton>
      </SettingRow>

      <SettingRow label="Helper process">
        <div style={{ display: 'flex', gap: 8, flex: 1, maxWidth: 560 }}>
          <input
            value={processName}
            onChange={(e) => setProcessName(e.target.value)}
            placeholder="Helper.exe"
            list={`${title.replace(/\s+/g, '-')}-processes`}
            style={{
              flex: 1,
              background: '#28282d',
              border: '1px solid #3a3a3e',
              borderRadius: 6,
              padding: '6px 10px',
              color: '#ffffff',
              fontSize: 12,
              outline: 'none',
              minWidth: 0
            }}
          />
          <datalist id={`${title.replace(/\s+/g, '-')}-processes`}>
            {processes.map((process) => (
              <option key={process.name} value={process.name} />
            ))}
          </datalist>
          <OutlinedButton onClick={saveProcess} disabled={savingProcess}>
            {savingProcess ? 'Saving...' : 'Update'}
          </OutlinedButton>
        </div>
        <MutedButton onClick={() => onRefreshProcesses()}>
          {loadingProcesses ? 'Refreshing...' : 'Refresh helper process list'}
        </MutedButton>
      </SettingRow>

      <ToggleRow
        label="Enabled"
        on={helper.enabled}
        onToggle={() => onChange({ ...helper, enabled: !helper.enabled })}
      />

      <ToggleRow
        label="Show on Home page"
        on={helper.visible}
        onToggle={() => onChange({ ...helper, visible: !helper.visible })}
      />
    </div>
  )
}

function MutedButton({
  onClick,
  children
}: {
  onClick: () => void
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'transparent',
        border: 'none',
        color: '#555560',
        cursor: 'pointer',
        fontSize: 11,
        padding: '4px 0',
        textAlign: 'left'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = '#8e8e9a'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = '#555560'
      }}
    >
      {children}
    </button>
  )
}

function BehaviorSettings({
  settings,
  onSave
}: {
  settings: Settings
  onSave: (s: Settings) => Promise<void>
}): React.JSX.Element {
  return (
    <div style={{ padding: '32px 36px', flex: 1, display: 'flex', flexDirection: 'column' }}>
      <PageHeading>Behavior</PageHeading>

      <SectionHeading>Startup behavior</SectionHeading>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 32 }}>
        <CheckboxRow
          label="Monitoring enabled"
          checked={settings.monitoringEnabled}
          onChange={() => onSave({ ...settings, monitoringEnabled: !settings.monitoringEnabled })}
        />
        <CheckboxRow
          label="Launch with Windows"
          checked={settings.launchWithWindows}
          onChange={() => onSave({ ...settings, launchWithWindows: !settings.launchWithWindows })}
        />
      </div>
    </div>
  )
}

function PageHeading({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <h1 style={{ fontSize: 18, fontWeight: 700, color: '#ffffff', margin: '0 0 24px' }}>
      {children}
    </h1>
  )
}

function SectionHeading({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <h2
      style={{
        fontSize: 12,
        fontWeight: 600,
        color: '#8e8e9a',
        margin: '0 0 14px',
        textTransform: 'uppercase',
        letterSpacing: '0.08em'
      }}
    >
      {children}
    </h2>
  )
}

function SettingRow({
  label,
  children
}: {
  label: React.ReactNode
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <div style={{ marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span style={{ fontSize: 13, color: '#d0d0d8' }}>{label}</span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>{children}</div>
    </div>
  )
}

function ToggleRow({
  label,
  on,
  onToggle
}: {
  label: string
  on: boolean
  onToggle: () => void
}): React.JSX.Element {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 12,
        maxWidth: 560
      }}
    >
      <span style={{ fontSize: 12, color: '#8e8e9a' }}>{label}</span>
      <button
        onClick={onToggle}
        title={on ? 'Disable' : 'Enable'}
        style={{
          width: 30,
          height: 16,
          borderRadius: 8,
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          background: on ? 'var(--accent)' : '#3a3a3e',
          position: 'relative',
          flexShrink: 0,
          transition: 'background 0.2s'
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: 2,
            left: on ? 16 : 2,
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: '#ffffff',
            transition: 'left 0.2s'
          }}
        />
      </button>
    </div>
  )
}

function OutlinedButton({
  onClick,
  disabled,
  children
}: {
  onClick: () => void
  disabled?: boolean
  children: React.ReactNode
}): React.JSX.Element {
  const [hovered, setHovered] = React.useState(false)
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background:
          hovered && !disabled
            ? 'color-mix(in srgb, var(--accent) 12%, transparent)'
            : 'transparent',
        border: `1px solid ${disabled ? '#3a3a3e' : 'var(--accent)'}`,
        borderRadius: 6,
        padding: '6px 14px',
        color: disabled ? '#555560' : 'var(--accent)',
        fontSize: 12,
        fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        whiteSpace: 'nowrap',
        transition: 'background 0.12s'
      }}
    >
      {children}
    </button>
  )
}

function CheckboxRow({
  label,
  checked,
  onChange
}: {
  label: string
  checked: boolean
  onChange: () => void
}): React.JSX.Element {
  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        cursor: 'pointer',
        userSelect: 'none'
      }}
    >
      <span
        onClick={onChange}
        style={{
          width: 16,
          height: 16,
          borderRadius: 3,
          border: `1.5px solid ${checked ? 'var(--accent)' : '#3a3a3e'}`,
          background: checked ? 'var(--accent)' : 'transparent',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          transition: 'background 0.15s, border-color 0.15s'
        }}
      >
        {checked && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path
              d="M1 4l3 3 5-6"
              stroke="#fff"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
      <span onClick={onChange} style={{ fontSize: 13, color: '#d0d0d8' }}>
        {label}
      </span>
    </label>
  )
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

function AppearanceSection({
  settings,
  onSave
}: {
  settings: Settings
  onSave: (s: Settings) => Promise<void>
}): React.JSX.Element {
  const colorInputRef = React.useRef<HTMLInputElement>(null)
  const isCustom = !ACCENT_PRESETS.includes(settings.themeColor)

  return (
    <div style={{ marginTop: 20 }}>
      <SectionHeading>Appearance</SectionHeading>
      <SettingRow label="Accent color">
        <div
          style={{
            display: 'flex',
            gap: 8,
            alignItems: 'center',
            flexWrap: 'wrap',
            position: 'relative'
          }}
        >
          {ACCENT_PRESETS.map((color) => {
            const active = settings.themeColor === color
            return (
              <button
                key={color}
                onClick={() => onSave({ ...settings, themeColor: color })}
                title={color}
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  border: 'none',
                  background: color,
                  cursor: 'pointer',
                  padding: 0,
                  flexShrink: 0,
                  outline: active ? '2px solid #ffffff' : '2px solid transparent',
                  outlineOffset: 2
                }}
              />
            )
          })}
          <button
            onClick={() => colorInputRef.current?.click()}
            title="Custom color"
            style={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              border: 'none',
              background: 'conic-gradient(red, yellow, lime, cyan, blue, magenta, red)',
              cursor: 'pointer',
              padding: 0,
              flexShrink: 0,
              outline: isCustom ? '2px solid #ffffff' : '2px solid transparent',
              outlineOffset: 2
            }}
          />
          <input
            ref={colorInputRef}
            type="color"
            value={settings.themeColor}
            onChange={(e) => onSave({ ...settings, themeColor: e.target.value })}
            style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 0, height: 0 }}
          />
        </div>
      </SettingRow>
    </div>
  )
}
