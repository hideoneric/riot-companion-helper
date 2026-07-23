import React from 'react'
import type { AppState, Page, Settings } from '../App'
import { getReadiness } from '../lib/command-center'
import { StatusDot } from './CommandUi'

interface Props {
  activePage: Page
  appState: AppState
  settings: Settings
  onNavigate: (page: Page) => void
}

const NAV_ITEMS: { page: Page; label: string; icon: React.ReactNode }[] = [
  {
    page: 'overview',
    label: 'Command',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M2 3h12v4H2z" fill="currentColor" opacity="0.9" />
        <path d="M2 9h5v4H2z" fill="currentColor" opacity="0.55" />
        <path d="M9 9h5v4H9z" fill="currentColor" opacity="0.55" />
      </svg>
    )
  },
  {
    page: 'settings',
    label: 'Settings',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <circle cx="8" cy="8" r="2.2" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M8 2v2M8 12v2M2 8h2M12 8h2M3.76 3.76l1.42 1.42M10.82 10.82l1.42 1.42M3.76 12.24l1.42-1.42M10.82 5.18l1.42-1.42"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.4"
        />
      </svg>
    )
  }
]

export function Sidebar({ activePage, appState, settings, onNavigate }: Props) {
  const pathConfigured = appState.blitzPathSet || appState.porofessorPathSet
  const readiness = getReadiness({
    pathConfigured,
    monitoringEnabled: appState.monitoringEnabled
  })
  const visibleCompanions = Number(settings.blitzVisible) + Number(settings.porofessorVisible)

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">R</div>
        <div>
          <div className="sidebar-title">Riot Helper</div>
          <div className="sidebar-subtitle">Companion control</div>
        </div>
      </div>

      <div className={`sidebar-status ${readiness.tone}`}>
        <StatusDot tone={readiness.tone} pulse={readiness.tone === 'active'} />
        <div>
          <div>{readiness.label}</div>
          <span>{visibleCompanions} visible helpers</span>
        </div>
      </div>

      <nav className="sidebar-nav">
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
    </aside>
  )
}

function NavItem({
  label,
  icon,
  active,
  onClick
}: {
  label: string
  icon: React.ReactNode
  active: boolean
  onClick: () => void
}) {
  return (
    <button className={`sidebar-nav-item ${active ? 'active' : ''}`.trim()} onClick={onClick}>
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  )
}
