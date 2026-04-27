export type ReadinessTone = 'active' | 'paused' | 'setup'
export type EntityTone = 'running' | 'idle' | 'disabled'

const toneColors: Record<ReadinessTone | EntityTone, string> = {
  active: 'var(--accent)',
  setup: '#f0a500',
  paused: '#74747f',
  running: '#31d07f',
  idle: '#555560',
  disabled: '#3a3a42'
}

export interface ReadinessInput {
  pathConfigured: boolean
  monitoringEnabled: boolean
}

export interface ReadinessState {
  label: 'ACTIVE' | 'PAUSED' | 'SETUP NEEDED'
  tone: ReadinessTone
  description: string
}

export interface EntityInput {
  enabled: boolean
  running: boolean
}

export interface EntityState {
  label: 'Running' | 'Idle' | 'Disabled'
  tone: EntityTone
}

export function getReadiness({
  pathConfigured,
  monitoringEnabled
}: ReadinessInput): ReadinessState {
  if (!pathConfigured) {
    return {
      label: 'SETUP NEEDED',
      tone: 'setup',
      description: 'Choose at least one companion app path before monitoring can start.'
    }
  }

  if (!monitoringEnabled) {
    return {
      label: 'PAUSED',
      tone: 'paused',
      description: 'Monitoring is disabled. Companion apps will stay untouched.'
    }
  }

  return {
    label: 'ACTIVE',
    tone: 'active',
    description: 'Watching enabled games and managing configured companions.'
  }
}

export function getEntityTone({ enabled, running }: EntityInput): EntityState {
  if (!enabled) return { label: 'Disabled', tone: 'disabled' }
  if (running) return { label: 'Running', tone: 'running' }
  return { label: 'Idle', tone: 'idle' }
}

export function toneColor(tone: ReadinessTone | EntityTone): string {
  return toneColors[tone]
}
