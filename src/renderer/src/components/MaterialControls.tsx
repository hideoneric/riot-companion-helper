import type React from 'react'

export function SectionHeader({
  icon,
  title,
  note,
  compact = false
}: {
  icon?: string
  title: string
  note?: string
  compact?: boolean
}) {
  return (
    <div className={`section-header ${compact ? 'compact' : ''}`.trim()}>
      {icon && <Icon name={icon} />}
      <h2>{title}</h2>
      {note && <p>{note}</p>}
    </div>
  )
}

export function Toggle({
  checked,
  disabled = false,
  label = 'Toggle',
  onToggle
}: {
  checked: boolean
  disabled?: boolean
  label?: string
  onToggle: () => void
}) {
  return (
    <button
      className={`switch ${checked ? 'checked' : ''}`.trim()}
      disabled={disabled}
      onClick={onToggle}
      aria-label={label}
      aria-pressed={checked}
    >
      <span>{checked ? 'On' : 'Off'}</span>
      <i />
    </button>
  )
}

export function StatusPill({
  tone,
  children
}: {
  tone: 'active' | 'paused' | 'setup' | 'running' | 'idle' | 'disabled'
  children: React.ReactNode
}) {
  return <span className={`status-pill tone-${tone}`}>{children}</span>
}

export function Icon({ name }: { name: string }) {
  return (
    <span className="material-symbols-rounded icon" aria-hidden="true">
      {name}
    </span>
  )
}
