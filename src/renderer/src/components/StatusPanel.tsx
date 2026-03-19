import React from 'react'

interface Props {
  leagueRunning: boolean
  blitzRunning: boolean
  monitoringEnabled: boolean
  blitzPathSet: boolean
}

export function StatusPanel({ leagueRunning, blitzRunning, monitoringEnabled, blitzPathSet }: Props) {
  const label = !blitzPathSet
    ? 'WAITING FOR BLITZ PATH'
    : !monitoringEnabled
    ? 'MONITORING PAUSED'
    : 'MONITORING ACTIVE'

  const labelColor = !blitzPathSet ? '#f0a500' : !monitoringEnabled ? '#888899' : '#7c5cbf'

  return (
    <div
      style={{
        padding: '28px 32px 24px',
        textAlign: 'center',
        borderBottom: '1px solid #2d2b45',
        background: '#0f0e17',
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: '0.14em',
          color: labelColor,
          marginBottom: 20,
          textTransform: 'uppercase',
        }}
      >
        ◉ {label}
      </div>

      {!blitzPathSet && (
        <div style={{ fontSize: 12, color: '#f0a500', marginBottom: 18, opacity: 0.85 }}>
          Open Settings ⚙ to set the Blitz.exe path
        </div>
      )}

      <ProcessRow label="League of Legends" running={leagueRunning} />
      <ProcessRow label="Blitz.gg" running={blitzRunning} />
    </div>
  )
}

function ProcessRow({ label, running }: { label: string; running: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        fontSize: 13,
      }}
    >
      <span style={{ color: '#a0a0b8' }}>{label}</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: running ? '#4caf50' : '#888899',
            display: 'inline-block',
            boxShadow: running ? '0 0 6px #4caf5099' : 'none',
            transition: 'background 0.3s, box-shadow 0.3s',
          }}
        />
        <span style={{ color: running ? '#4caf50' : '#888899', fontSize: 12, minWidth: 72 }}>
          {running ? 'Running' : 'Not Running'}
        </span>
      </span>
    </div>
  )
}
