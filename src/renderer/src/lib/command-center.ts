export type ReadinessTone = 'active' | 'paused' | 'setup'
export type EntityTone = 'running' | 'idle' | 'disabled'

const toneColors: Record<ReadinessTone | EntityTone, string> = {
  active: 'var(--text)',
  setup: 'var(--muted)',
  paused: 'var(--dim)',
  running: 'var(--text)',
  idle: 'var(--dim)',
  disabled: 'var(--disabled)'
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

export interface CommandSummaryInput {
  leagueRunning: boolean
  valorantRunning: boolean
  configuredHelpers: number
  runningHelpers: number
}

export interface CommandSummary {
  activeGames: number
  configuredHelpers: number
  runningHelpers: number
  helperLabel: string
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

export function getCommandSummary({
  leagueRunning,
  valorantRunning,
  configuredHelpers,
  runningHelpers
}: CommandSummaryInput): CommandSummary {
  return {
    activeGames: Number(leagueRunning) + Number(valorantRunning),
    configuredHelpers,
    runningHelpers,
    helperLabel: `${runningHelpers} of ${configuredHelpers} running`
  }
}

export function toneColor(tone: ReadinessTone | EntityTone): string {
  return toneColors[tone]
}
