import React from 'react'
import type { Page } from '../App'

interface Props {
  activePage: Page
  onNavigate: (page: Page) => void
}

const NAV_ITEMS: { page: Page; label: string; icon: React.ReactNode }[] = [
  {
    page: 'home',
    label: 'Home',
    icon: (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
        <rect x="1" y="1" width="5.5" height="5.5" rx="1" fill="currentColor" />
        <rect x="8.5" y="1" width="5.5" height="5.5" rx="1" fill="currentColor" />
        <rect x="1" y="8.5" width="5.5" height="5.5" rx="1" fill="currentColor" />
        <rect x="8.5" y="8.5" width="5.5" height="5.5" rx="1" fill="currentColor" />
      </svg>
    ),
  },
  {
    page: 'settings',
    label: 'Settings',
    icon: (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
        <circle cx="7.5" cy="7.5" r="2" fill="currentColor" />
        <path
          d="M7.5 1v1.5M7.5 12.5V14M1 7.5h1.5M12.5 7.5H14M2.697 2.697l1.06 1.06M11.243 11.243l1.06 1.06M2.697 12.303l1.06-1.06M11.243 3.757l1.06-1.06"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
]

export function Sidebar({ activePage, onNavigate }: Props) {
  return (
    <div
      style={{
        width: 170,
        flexShrink: 0,
        background: '#111114',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid #2c2c32',
      }}
    >
      <nav style={{ display: 'flex', flexDirection: 'column', paddingTop: 8 }}>
        {NAV_ITEMS.map(({ page, label, icon }) => (
          <NavItem
            key={page}
            label={label}
            icon={icon}
            active={activePage === page}
            onClick={() => onNavigate(page)}
          />
        ))}
      </nav>
    </div>
  )
}

function NavItem({
  label,
  icon,
  active,
  onClick,
}: {
  label: string
  icon: React.ReactNode
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
        gap: 10,
        padding: '0 16px',
        height: 40,
        background: active || hovered ? '#1a1a1e' : 'transparent',
        border: 'none',
        borderLeft: `3px solid ${active ? '#7c5cbf' : 'transparent'}`,
        borderRight: 'none',
        borderTop: 'none',
        borderBottom: 'none',
        color: active ? '#ffffff' : hovered ? '#d0d0d8' : '#8e8e9a',
        cursor: 'pointer',
        fontSize: 13,
        fontWeight: active ? 600 : 400,
        textAlign: 'left',
        width: '100%',
        transition: 'background 0.12s, color 0.12s',
        paddingLeft: active ? 13 : 16,
      }}
    >
      <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>{icon}</span>
      <span>{label}</span>
    </button>
  )
}
