import { describe, expect, test } from 'vitest'
import { getEntityTone, getReadiness } from '../src/renderer/src/lib/command-center'

describe('command center status helpers', () => {
  test('requires setup when no companion path is configured', () => {
    expect(getReadiness({ pathConfigured: false, monitoringEnabled: true })).toEqual({
      label: 'SETUP NEEDED',
      tone: 'setup',
      description: 'Choose at least one companion app path before monitoring can start.'
    })
  })

  test('shows paused when monitoring is disabled after setup', () => {
    expect(getReadiness({ pathConfigured: true, monitoringEnabled: false })).toEqual({
      label: 'PAUSED',
      tone: 'paused',
      description: 'Monitoring is disabled. Companion apps will stay untouched.'
    })
  })

  test('shows active when setup is complete and monitoring is enabled', () => {
    expect(getReadiness({ pathConfigured: true, monitoringEnabled: true })).toEqual({
      label: 'ACTIVE',
      tone: 'active',
      description: 'Watching enabled games and managing configured companions.'
    })
  })

  test('prioritizes disabled entity state over process state', () => {
    expect(getEntityTone({ enabled: false, running: true })).toEqual({
      label: 'Disabled',
      tone: 'disabled'
    })
  })

  test('maps running and idle entity states', () => {
    expect(getEntityTone({ enabled: true, running: true })).toEqual({
      label: 'Running',
      tone: 'running'
    })
    expect(getEntityTone({ enabled: true, running: false })).toEqual({
      label: 'Idle',
      tone: 'idle'
    })
  })
})
