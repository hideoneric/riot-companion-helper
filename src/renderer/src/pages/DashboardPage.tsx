import React from 'react'
import type { AppState } from '../App'

interface Props extends AppState {
  onNavigateToSettings: () => void
}

export function DashboardPage({
  leagueRunning,
  blitzRunning,
  monitoringEnabled,
  blitzPathSet,
  onNavigateToSettings,
}: Props) {
  if (!blitzPathSet) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 16,
          padding: 40,
        }}
      >
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 3L2 21h20L12 3z"
            stroke="#f0a500"
            strokeWidth="1.5"
            strokeLinejoin="round"
            fill="none"
          />
          <rect x="11" y="10" width="2" height="5" rx="1" fill="#f0a500" />
          <rect x="11" y="17" width="2" height="2" rx="1" fill="#f0a500" />
        </svg>
        <p style={{ color: '#8e8e9a', fontSize: 14, textAlign: 'center', margin: 0 }}>
          Set your Blitz.exe path in Settings to get started
        </p>
        <button
          onClick={onNavigateToSettings}
          style={{
            background: 'transparent',
            border: '1px solid #2c2c32',
            borderRadius: 6,
            color: '#8e8e9a',
            cursor: 'pointer',
            fontSize: 13,
            padding: '7px 18px',
            transition: 'border-color 0.15s, color 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#7c5cbf'
            e.currentTarget.style.color = '#ffffff'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#2c2c32'
            e.currentTarget.style.color = '#8e8e9a'
          }}
        >
          Open Settings
        </button>
      </div>
    )
  }

  const statusLabel = !monitoringEnabled ? 'MONITORING PAUSED' : 'MONITORING ACTIVE'
  const statusColor = !monitoringEnabled ? '#8e8e9a' : '#7c5cbf'

  return (
    <div style={{ padding: '32px 36px', flex: 1 }}>
      {/* Monitoring section */}
      <SectionHeading>Monitoring</SectionHeading>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 32,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: statusColor,
              display: 'inline-block',
              boxShadow: !monitoringEnabled ? 'none' : '0 0 8px #7c5cbf88',
            }}
          />
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.1em',
              color: statusColor,
            }}
          >
            {statusLabel}
          </span>
        </div>
      </div>

      {/* Processes section */}
      <SectionHeading>Processes</SectionHeading>
      <div
        style={{
          background: '#28282d',
          borderRadius: 8,
          border: '1px solid #2c2c32',
          overflow: 'hidden',
        }}
      >
        <ProcessRow label="League of Legends" running={leagueRunning} />
        <div style={{ height: 1, background: '#2c2c32' }} />
        <ProcessRow label="Blitz.gg" running={blitzRunning} />
      </div>
    </div>
  )
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        fontSize: 13,
        fontWeight: 600,
        color: '#ffffff',
        margin: '0 0 16px',
        paddingBottom: 8,
        borderBottom: '1px solid #2c2c32',
      }}
    >
      {children}
    </h2>
  )
}

function ProcessRow({ label, running }: { label: string; running: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '14px 18px',
      }}
    >
      <span style={{ fontSize: 13, color: '#d0d0d8' }}>{label}</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: running ? '#4caf50' : '#3a3a3e',
            display: 'inline-block',
            boxShadow: running ? '0 0 6px #4caf5066' : 'none',
            transition: 'background 0.3s, box-shadow 0.3s',
          }}
        />
        <span
          style={{
            fontSize: 12,
            color: running ? '#4caf50' : '#555560',
            minWidth: 72,
          }}
        >
          {running ? 'Running' : 'Not Running'}
        </span>
      </span>
    </div>
  )
}
