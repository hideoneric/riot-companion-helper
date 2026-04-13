import React from 'react'
import type { SubPage } from '../App'

interface Props {
  activeSub: SubPage
  onNavigate: (sub: SubPage) => void
}

const ITEMS: { sub: SubPage; label: string }[] = [
  { sub: 'general', label: 'General' },
  { sub: 'behavior', label: 'Behavior' },
]

export function SubNav({ activeSub, onNavigate }: Props) {
  return (
    <div
      style={{
        width: 160,
        flexShrink: 0,
        background: '#1a1a1e',
        borderRight: '1px solid #2c2c32',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
      }}
    >
      <div
        style={{
          padding: '16px 16px 8px',
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.12em',
          color: '#555560',
          textTransform: 'uppercase',
          flexShrink: 0,
        }}
      >
        Settings
      </div>
      <nav style={{ display: 'flex', flexDirection: 'column' }}>
        {ITEMS.map(({ sub, label }) => {
          const active = activeSub === sub
          return <SubNavItem key={sub} label={label} active={active} onClick={() => onNavigate(sub)} />
        })}
      </nav>
    </div>
  )
}

function SubNavItem({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  const [hovered, setHovered] = React.useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        height: 36,
        background: active ? '#28282d' : hovered ? '#242428' : 'transparent',
        border: 'none',
        borderLeft: active ? '2px solid var(--accent)' : '2px solid transparent',
        borderRight: 'none',
        borderTop: 'none',
        borderBottom: 'none',
        color: active ? '#ffffff' : hovered ? '#d0d0d8' : '#8e8e9a',
        cursor: 'pointer',
        fontSize: 13,
        fontWeight: active ? 500 : 400,
        textAlign: 'left',
        width: '100%',
        transition: 'background 0.12s, color 0.12s',
        paddingLeft: active ? 14 : 16,
      }}
    >
      {label}
    </button>
  )
}
