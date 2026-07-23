import React from 'react'
import { toneColor, type EntityTone, type ReadinessTone } from '../lib/command-center'

export function StatusDot({
  tone,
  pulse = false
}: {
  tone: ReadinessTone | EntityTone
  pulse?: boolean
}) {
  const color = toneColor(tone)
  return (
    <span
      style={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: color,
        boxShadow: pulse ? `0 0 12px ${color}88` : 'none',
        flexShrink: 0
      }}
    />
  )
}

export function ToggleSwitch({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      title={on ? 'Disable' : 'Enable'}
      className="cc-toggle"
      style={{
        background: on ? 'var(--accent)' : '#34343b'
      }}
    >
      <span
        style={{
          transform: on ? 'translateX(14px)' : 'translateX(0)'
        }}
      />
    </button>
  )
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="cc-section-label">{children}</div>
}

export function CommandCard({
  children,
  className = ''
}: {
  children: React.ReactNode
  className?: string
}) {
  return <section className={`cc-card ${className}`.trim()}>{children}</section>
}

export function IconButton({
  title,
  onClick,
  children,
  danger = false,
  disabled = false
}: {
  title: string
  onClick: () => void
  children: React.ReactNode
  danger?: boolean
  disabled?: boolean
}) {
  return (
    <button
      title={title}
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
      className={`cc-icon-button ${danger ? 'danger' : ''}`.trim()}
    >
      {children}
    </button>
  )
}

export function PrimaryButton({
  children,
  onClick,
  disabled = false
}: {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button className="cc-button primary" onClick={onClick} disabled={disabled}>
      {children}
    </button>
  )
}

export function SecondaryButton({
  children,
  onClick,
  disabled = false
}: {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button className="cc-button secondary" onClick={onClick} disabled={disabled}>
      {children}
    </button>
  )
}
