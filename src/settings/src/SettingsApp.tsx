import React, { useState, useEffect } from 'react'
import { PathField } from './components/PathField'
import { ToggleRow } from './components/ToggleRow'
import { IntervalSelect } from './components/IntervalSelect'

declare const window: Window & {
  settingsApi: {
    getSettings: () => Promise<{
      blitzPath: string
      launchWithWindows: boolean
      pollingInterval: number
      monitoringEnabled: boolean
    }>
    saveSettings: (s: unknown) => Promise<void>
    browse: () => Promise<string | null>
  }
}

export default function SettingsApp() {
  const [blitzPath, setBlitzPath] = useState('')
  const [launchWithWindows, setLaunchWithWindows] = useState(false)
  const [pollingInterval, setPollingInterval] = useState(3)
  const [monitoringEnabled, setMonitoringEnabled] = useState(true)
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(false)

  const pathValid = !blitzPath || blitzPath.toLowerCase().endsWith('.exe')

  useEffect(() => {
    window.settingsApi.getSettings().then((s) => {
      setBlitzPath(s.blitzPath)
      setLaunchWithWindows(s.launchWithWindows)
      setPollingInterval(s.pollingInterval)
      setMonitoringEnabled(s.monitoringEnabled)
      setLoaded(true)
    })
  }, [])

  const handleBrowse = async () => {
    const p = await window.settingsApi.browse()
    if (p) setBlitzPath(p)
  }

  const handleSave = async () => {
    setSaving(true)
    await window.settingsApi.saveSettings({
      blitzPath,
      launchWithWindows,
      pollingInterval,
      monitoringEnabled,
    })
    setSaving(false)
    window.close()
  }

  const canSave = pathValid && !!blitzPath

  if (!loaded) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f0e17', color: '#555', fontSize: 12 }}>
        Loading...
      </div>
    )
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#0f0e17' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '11px 16px',
          background: '#1c1b2e',
          borderBottom: '1px solid #2d2b45',
          WebkitAppRegion: 'drag',
        } as React.CSSProperties}
      >
        <span style={{ marginRight: 8, fontSize: 14 }}>⚙</span>
        <span style={{ fontWeight: 700, fontSize: 13, flex: 1 }}>Settings</span>
        <button
          onClick={() => window.close()}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#a0a0b8',
            cursor: 'pointer',
            fontSize: 15,
            WebkitAppRegion: 'no-drag',
            lineHeight: 1,
          } as React.CSSProperties}
        >
          ✕
        </button>
      </div>

      {/* Form */}
      <div style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', gap: 20, overflowY: 'auto' }}>
        <PathField
          value={blitzPath}
          onChange={setBlitzPath}
          onBrowse={handleBrowse}
          valid={pathValid}
        />
        <ToggleRow
          label="Start with Windows"
          value={launchWithWindows}
          onChange={setLaunchWithWindows}
        />
        <IntervalSelect value={pollingInterval} onChange={setPollingInterval} />
        <ToggleRow
          label="Monitoring Enabled"
          value={monitoringEnabled}
          onChange={setMonitoringEnabled}
        />
      </div>

      {/* Save */}
      <div style={{ padding: '14px 20px', borderTop: '1px solid #2d2b45' }}>
        <button
          onClick={handleSave}
          disabled={!canSave || saving}
          style={{
            width: '100%',
            padding: '9px',
            background: canSave && !saving ? '#7c5cbf' : '#1c1b2e',
            border: `1px solid ${canSave && !saving ? '#7c5cbf' : '#2d2b45'}`,
            borderRadius: 8,
            color: canSave && !saving ? '#fff' : '#555',
            fontSize: 13,
            fontWeight: 700,
            cursor: canSave && !saving ? 'pointer' : 'not-allowed',
            transition: 'background 0.2s, color 0.2s',
          }}
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
        {!blitzPath && (
          <div style={{ fontSize: 11, color: '#888', textAlign: 'center', marginTop: 8 }}>
            Set Blitz.exe path to enable Save
          </div>
        )}
      </div>
    </div>
  )
}
