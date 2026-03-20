import React, { useState, useEffect } from 'react'
import type { Settings, SubPage } from '../App'

declare const window: Window & {
  api: {
    browse: () => Promise<string | null>
    detectOverwolf: () => Promise<string | null>
  }
}

interface Props {
  sub: SubPage
  settings: Settings
  onSave: (s: Settings) => Promise<void>
}

export function SettingsPage({ sub, settings, onSave }: Props) {
  return sub === 'general'
    ? <GeneralSettings settings={settings} onSave={onSave} />
    : <BehaviorSettings settings={settings} onSave={onSave} />
}

/* ─── General ──────────────────────────────────────────────── */

function GeneralSettings({ settings, onSave }: { settings: Settings; onSave: (s: Settings) => Promise<void> }) {
  const [blitzPath, setBlitzPath] = useState(settings.blitzPath)
  const [valorantPath, setValorantPath] = useState(settings.valorantTrackerPath)
  const [interval, setInterval] = useState(settings.pollingInterval)
  const [savingBlitz, setSavingBlitz] = useState(false)
  const [savingValorant, setSavingValorant] = useState(false)
  const blitzPathValid = !blitzPath || blitzPath.toLowerCase().endsWith('.exe')
  const valorantPathValid = !valorantPath || valorantPath.toLowerCase().endsWith('.exe')

  useEffect(() => { setBlitzPath(settings.blitzPath) }, [settings.blitzPath])
  useEffect(() => { setValorantPath(settings.valorantTrackerPath) }, [settings.valorantTrackerPath])
  useEffect(() => { setInterval(settings.pollingInterval) }, [settings.pollingInterval])

  const handleBrowse = async (setter: (v: string) => void) => {
    const p = await window.api.browse()
    if (p) setter(p)
  }

  const handleUpdateBlitz = async () => {
    if (!blitzPathValid) return
    setSavingBlitz(true)
    await onSave({ ...settings, blitzPath })
    setSavingBlitz(false)
  }

  const handleUpdateValorant = async () => {
    if (!valorantPathValid) return
    setSavingValorant(true)
    await onSave({ ...settings, valorantTrackerPath: valorantPath })
    setSavingValorant(false)
  }

  const handleAutoDetectOverwolf = async () => {
    const p = await window.api.detectOverwolf()
    if (p) {
      setValorantPath(p)
      await onSave({ ...settings, valorantTrackerPath: p })
    }
  }

  const handleUpdateInterval = async (v: number) => {
    setInterval(v)
    await onSave({ ...settings, pollingInterval: v })
  }

  return (
    <div style={{ padding: '32px 36px', flex: 1, overflowY: 'auto' }}>
      <PageHeading>General</PageHeading>

      {/* ── League of Legends / Blitz ── */}
      <SectionHeading>League of Legends</SectionHeading>

      <SettingRow label="Blitz path">
        <div style={{ display: 'flex', gap: 8, flex: 1, maxWidth: 420 }}>
          <input
            value={blitzPath}
            onChange={(e) => setBlitzPath(e.target.value)}
            placeholder="C:\...\Blitz.exe"
            style={{
              flex: 1, background: '#28282d',
              border: `1px solid ${blitzPathValid ? '#3a3a3e' : '#c0392b'}`,
              borderRadius: 6, padding: '6px 10px', color: '#ffffff', fontSize: 12, outline: 'none',
            }}
          />
          <OutlinedButton onClick={handleUpdateBlitz} disabled={!blitzPathValid || savingBlitz}>
            {savingBlitz ? 'Saving…' : 'Update'}
          </OutlinedButton>
        </div>
        {!blitzPathValid && blitzPath && (
          <div style={{ fontSize: 11, color: '#c0392b', marginTop: 5 }}>Must be a .exe file</div>
        )}
        <MutedButton onClick={() => handleBrowse(setBlitzPath)}>Browse…</MutedButton>
      </SettingRow>

      <div style={{ height: 1, background: '#2c2c32', margin: '20px 0' }} />

      {/* ── Valorant / Valorant Tracker ── */}
      <SectionHeading>Valorant</SectionHeading>

      <SettingRow label="Valorant Tracker path">
        <div style={{ display: 'flex', gap: 8, flex: 1, maxWidth: 420 }}>
          <input
            value={valorantPath}
            onChange={(e) => setValorantPath(e.target.value)}
            placeholder="C:\...\Overwolf.exe"
            style={{
              flex: 1, background: '#28282d',
              border: `1px solid ${valorantPathValid ? '#3a3a3e' : '#c0392b'}`,
              borderRadius: 6, padding: '6px 10px', color: '#ffffff', fontSize: 12, outline: 'none',
            }}
          />
          <OutlinedButton onClick={handleUpdateValorant} disabled={!valorantPathValid || savingValorant}>
            {savingValorant ? 'Saving…' : 'Update'}
          </OutlinedButton>
        </div>
        {!valorantPathValid && valorantPath && (
          <div style={{ fontSize: 11, color: '#c0392b', marginTop: 5 }}>Must be a .exe file</div>
        )}
        <div style={{ display: 'flex', gap: 12 }}>
          <MutedButton onClick={() => handleBrowse(setValorantPath)}>Browse…</MutedButton>
          <MutedButton onClick={handleAutoDetectOverwolf}>Auto-detect</MutedButton>
        </div>
      </SettingRow>

      <div style={{ height: 1, background: '#2c2c32', margin: '20px 0' }} />

      {/* ── Polling interval ── */}
      <SectionHeading>App</SectionHeading>

      <SettingRow label="Polling interval">
        <select
          value={interval}
          onChange={(e) => handleUpdateInterval(Number(e.target.value))}
          style={{
            background: '#28282d', border: '1px solid #3a3a3e', borderRadius: 6,
            padding: '6px 10px', color: '#ffffff', fontSize: 12, cursor: 'pointer', outline: 'none',
          }}
        >
          {[1, 2, 3, 5, 10].map((s) => (
            <option key={s} value={s}>{s}s</option>
          ))}
        </select>
      </SettingRow>
    </div>
  )
}

function MutedButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{ background: 'transparent', border: 'none', color: '#555560', cursor: 'pointer', fontSize: 11, padding: '4px 0', textAlign: 'left' }}
      onMouseEnter={(e) => { e.currentTarget.style.color = '#8e8e9a' }}
      onMouseLeave={(e) => { e.currentTarget.style.color = '#555560' }}
    >
      {children}
    </button>
  )
}

/* ─── Behavior ─────────────────────────────────────────────── */

function BehaviorSettings({ settings, onSave }: { settings: Settings; onSave: (s: Settings) => Promise<void> }) {
  const [monitoring, setMonitoring] = useState(settings.monitoringEnabled)
  const [startup, setStartup] = useState(settings.launchWithWindows)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setMonitoring(settings.monitoringEnabled)
    setStartup(settings.launchWithWindows)
    setDirty(false)
  }, [settings.monitoringEnabled, settings.launchWithWindows])

  const toggle = (field: 'monitoring' | 'startup') => {
    if (field === 'monitoring') setMonitoring((v) => !v)
    else setStartup((v) => !v)
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
    <div style={{ padding: '32px 36px', flex: 1, display: 'flex', flexDirection: 'column' }}>
      <PageHeading>Behavior</PageHeading>

      <SectionHeading>Startup behavior</SectionHeading>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 32 }}>
        <CheckboxRow
          label="Monitoring enabled"
          checked={monitoring}
          onChange={() => toggle('monitoring')}
        />
        <CheckboxRow
          label="Launch with Windows"
          checked={startup}
          onChange={() => toggle('startup')}
        />
      </div>

      {/* Sticky save bar */}
      {dirty && (
        <div
          style={{
            display: 'flex',
            gap: 10,
            alignItems: 'center',
            paddingTop: 20,
            borderTop: '1px solid #2c2c32',
            marginTop: 'auto',
          }}
        >
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              background: '#7c5cbf',
              border: 'none',
              borderRadius: 6,
              padding: '7px 20px',
              color: '#ffffff',
              fontSize: 13,
              fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button
            onClick={handleDiscard}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#8e8e9a',
              fontSize: 13,
              cursor: 'pointer',
              padding: '7px 8px',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#ffffff' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#8e8e9a' }}
          >
            Discard
          </button>
        </div>
      )}
    </div>
  )
}

/* ─── Shared sub-components ────────────────────────────────── */

function PageHeading({ children }: { children: React.ReactNode }) {
  return (
    <h1 style={{ fontSize: 18, fontWeight: 700, color: '#ffffff', margin: '0 0 24px' }}>
      {children}
    </h1>
  )
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ fontSize: 12, fontWeight: 600, color: '#8e8e9a', margin: '0 0 14px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
      {children}
    </h2>
  )
}

function SettingRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <span style={{ fontSize: 13, color: '#d0d0d8', whiteSpace: 'nowrap' }}>{label}</span>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          {children}
        </div>
      </div>
    </div>
  )
}

function OutlinedButton({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void
  disabled?: boolean
  children: React.ReactNode
}) {
  const [hovered, setHovered] = React.useState(false)
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered && !disabled ? 'rgba(124,92,191,0.12)' : 'transparent',
        border: `1px solid ${disabled ? '#3a3a3e' : '#7c5cbf'}`,
        borderRadius: 6,
        padding: '6px 14px',
        color: disabled ? '#555560' : '#7c5cbf',
        fontSize: 12,
        fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        whiteSpace: 'nowrap',
        transition: 'background 0.12s',
      }}
    >
      {children}
    </button>
  )
}

function CheckboxRow({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: () => void
}) {
  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        cursor: 'pointer',
        userSelect: 'none',
      }}
    >
      <span
        onClick={onChange}
        style={{
          width: 16,
          height: 16,
          borderRadius: 3,
          border: `1.5px solid ${checked ? '#7c5cbf' : '#3a3a3e'}`,
          background: checked ? '#7c5cbf' : 'transparent',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          transition: 'background 0.15s, border-color 0.15s',
        }}
      >
        {checked && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1 4l3 3 5-6" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <span onClick={onChange} style={{ fontSize: 13, color: '#d0d0d8' }}>{label}</span>
    </label>
  )
}
