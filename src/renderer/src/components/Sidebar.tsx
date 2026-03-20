import React from 'react'
import type { Page } from '../App'

interface Props {
  activePage: Page
  onNavigate: (page: Page) => void
  onMinimize: () => void
  onClose: () => void
}

const NAV_ITEMS: { page: Page; label: string; icon: React.ReactNode }[] = [
  {
    page: 'dashboard',
    label: 'Dashboard',
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
    page: 'activity',
    label: 'Activity Log',
    icon: (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
        <rect x="1" y="2" width="13" height="1.5" rx="0.75" fill="currentColor" />
        <rect x="1" y="6" width="10" height="1.5" rx="0.75" fill="currentColor" />
        <rect x="1" y="10" width="12" height="1.5" rx="0.75" fill="currentColor" />
      </svg>
    ),
  },
  {
    page: 'settings',
    label: 'Settings',
    icon: (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M7.5 5.5a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-3 2a3 3 0 1 1 6 0 3 3 0 0 1-6 0z"
          fill="currentColor"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M6.07 1.1a.65.65 0 0 1 .64-.53h1.58c.3 0 .56.2.63.49l.27 1.06c.36.12.7.28 1.01.48l1-.46a.65.65 0 0 1 .79.13l1.12 1.12c.2.2.25.5.13.77l-.46 1c.2.32.36.66.48 1.02l1.06.27c.28.07.48.33.48.63v1.58c0 .3-.2.56-.49.63l-1.06.27a5.02 5.02 0 0 1-.48 1.01l.46 1a.65.65 0 0 1-.13.79l-1.12 1.12a.65.65 0 0 1-.77.13l-1-.46c-.32.2-.66.36-1.02.48l-.27 1.06a.65.65 0 0 1-.63.48H6.29a.65.65 0 0 1-.63-.49l-.27-1.06a5.02 5.02 0 0 1-1.01-.48l-1 .46a.65.65 0 0 1-.79-.13L1.47 11.6a.65.65 0 0 1-.13-.77l.46-1a5.02 5.02 0 0 1-.48-1.02L.26 8.54A.65.65 0 0 1 0 7.9V6.32c0-.3.2-.56.49-.63l1.06-.27c.12-.36.28-.7.48-1.01l-.46-1a.65.65 0 0 1 .13-.79L2.82 1.5c.2-.2.5-.25.77-.13l1 .46c.32-.2.66-.36 1.02-.48L5.88 .29A.65.65 0 0 1 6.5 0h.57L6.07 1.1z"
          fill="currentColor"
          opacity="0"
        />
        <circle cx="7.5" cy="7.5" r="6.5" stroke="currentColor" strokeWidth="1.2" fill="none" />
      </svg>
    ),
  },
]

export function Sidebar({ activePage, onNavigate, onMinimize, onClose }: Props) {
  return (
    <div
      style={{
        width: 190,
        flexShrink: 0,
        background: '#111114',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid #2c2c32',
        height: '100vh',
      }}
    >
      {/* Brand / titlebar strip — draggable */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '0 8px 0 16px',
          height: 46,
          WebkitAppRegion: 'drag',
          flexShrink: 0,
        } as React.CSSProperties}
      >
        <span
          style={{
            flex: 1,
            fontSize: 12,
            fontWeight: 700,
            color: '#ffffff',
            letterSpacing: '0.02em',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          Riot Companion
        </span>
        <div style={{ display: 'flex', gap: 2, WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          <WinBtn onClick={onMinimize} title="Minimize" color="#8e8e9a">
            <svg width="10" height="2" viewBox="0 0 10 2" fill="currentColor">
              <rect width="10" height="2" rx="1" />
            </svg>
          </WinBtn>
          <WinBtn onClick={onClose} title="Hide to tray" color="#c0392b">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
              <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </WinBtn>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: '#2c2c32', flexShrink: 0 }} />

      {/* Nav items */}
      <nav style={{ display: 'flex', flexDirection: 'column', paddingTop: 8 }}>
        {NAV_ITEMS.map(({ page, label, icon }) => {
          const active = activePage === page
          return (
            <NavItem
              key={page}
              label={label}
              icon={icon}
              active={active}
              onClick={() => onNavigate(page)}
            />
          )
        })}
      </nav>
    </div>
  )
}

function WinBtn({
  onClick,
  title,
  color,
  children,
}: {
  onClick: () => void
  title: string
  color: string
  children: React.ReactNode
}) {
  const [hovered, setHovered] = React.useState(false)
  return (
    <button
      onClick={onClick}
      title={title}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 26,
        height: 26,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: hovered ? 'rgba(255,255,255,0.08)' : 'transparent',
        border: 'none',
        borderRadius: 4,
        color: hovered ? color : '#555560',
        cursor: 'pointer',
        transition: 'background 0.15s, color 0.15s',
        padding: 0,
      }}
    >
      {children}
    </button>
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
        borderLeft: active ? '3px solid #7c5cbf' : '3px solid transparent',
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
