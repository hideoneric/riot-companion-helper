import React from 'react'

interface Props {
  onOpenSettings: () => void
  onMinimize: () => void
  onClose: () => void
}

export function Header({ onOpenSettings, onMinimize, onClose }: Props) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '12px 16px',
        background: '#1c1b2e',
        borderBottom: '1px solid #2d2b45',
        WebkitAppRegion: 'drag',
      } as React.CSSProperties}
    >
      <span style={{ fontSize: 18, marginRight: 8 }}>⚡</span>
      <span style={{ fontWeight: 700, fontSize: 14, flex: 1, letterSpacing: '0.03em' }}>
        Riot Companion Helper
      </span>
      <div
        style={{ display: 'flex', gap: 6, WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <button onClick={onOpenSettings} title="Settings" style={btnStyle('#7c5cbf')}>
          ⚙
        </button>
        <button onClick={onMinimize} title="Minimize" style={btnStyle('#555')}>
          —
        </button>
        <button onClick={onClose} title="Hide to tray" style={btnStyle('#c0392b')}>
          ✕
        </button>
      </div>
    </div>
  )
}

function btnStyle(hoverColor: string): React.CSSProperties {
  return {
    background: 'transparent',
    border: 'none',
    color: '#a0a0b8',
    cursor: 'pointer',
    fontSize: 15,
    padding: '2px 8px',
    borderRadius: 4,
    transition: 'color 0.15s',
    lineHeight: 1,
  }
}
