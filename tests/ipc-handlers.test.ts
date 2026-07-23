import { describe, expect, it } from 'vitest'
import {
  getPollingUpdate,
  listProcessOptions,
  shouldRefreshPollingState
} from '../src/main/ipc-handlers'
import type { ProcessDetector } from '../src/main/process-detector'
import type { AppSettings } from '../src/main/settings-store'

const baseSettings: AppSettings = {
  blitzPath: 'C:\\Blitz\\Blitz.exe',
  blitzName: '',
  launchWithWindows: false,
  pollingInterval: 3,
  monitoringEnabled: true,
  leagueEnabled: true,
  valorantEnabled: true,
  blitzEnabled: true,
  porofessorPath: '',
  porofessorName: '',
  porofessorEnabled: false,
  blitzVisible: true,
  porofessorVisible: true,
  themeColor: '#d9e6ff',
  helpers: [
    {
      id: 'helper-1',
      path: 'C:\\Blitz\\Blitz.exe',
      displayName: '',
      detectedName: '',
      enabled: true,
      gameBindings: { league: true, valorant: true },
      showOnOverview: true
    },
    {
      id: 'helper-2',
      path: '',
      displayName: '',
      detectedName: '',
      enabled: false,
      gameBindings: { league: true, valorant: false },
      showOnOverview: true
    }
  ]
}

describe('getPollingUpdate', () => {
  it('does not restart polling for helper toggle-only settings saves', () => {
    const next = {
      ...baseSettings,
      helpers: baseSettings.helpers.map((helper) =>
        helper.id === 'helper-1' ? { ...helper, enabled: false } : helper
      )
    }

    expect(getPollingUpdate(baseSettings, next, true)).toBe('none')
  })

  it('starts polling when a helper path becomes available while monitoring is enabled', () => {
    const previous = {
      ...baseSettings,
      helpers: baseSettings.helpers.map((helper) => ({ ...helper, path: '' }))
    }

    expect(getPollingUpdate(previous, baseSettings, true)).toBe('start')
  })

  it('stops polling when monitoring is disabled', () => {
    expect(
      getPollingUpdate(baseSettings, { ...baseSettings, monitoringEnabled: false }, true)
    ).toBe('stop')
  })
})

describe('shouldRefreshPollingState', () => {
  it('refreshes without restarting when game toggles change', () => {
    expect(shouldRefreshPollingState(baseSettings, { ...baseSettings, leagueEnabled: false })).toBe(
      true
    )
  })

  it('refreshes without restarting when helper bindings change', () => {
    const next = {
      ...baseSettings,
      helpers: baseSettings.helpers.map((helper) =>
        helper.id === 'helper-1'
          ? { ...helper, gameBindings: { ...helper.gameBindings, league: false } }
          : helper
      )
    }

    expect(shouldRefreshPollingState(baseSettings, next)).toBe(true)
  })

  it('refreshes when a helper process selection changes', () => {
    const next = {
      ...baseSettings,
      helpers: baseSettings.helpers.map((helper) =>
        helper.id === 'helper-1' ? { ...helper, processName: 'Blitz.exe' } : helper
      )
    }

    expect(shouldRefreshPollingState(baseSettings, next)).toBe(true)
  })
})

describe('listProcessOptions', () => {
  it('sorts one shared detector snapshot', async () => {
    const detector: ProcessDetector = {
      snapshot: async () => new Set(['valorant.exe', 'blitz.exe'])
    }

    await expect(listProcessOptions(detector)).resolves.toEqual([
      { name: 'blitz.exe' },
      { name: 'valorant.exe' }
    ])
  })

  it('preserves detector errors', async () => {
    const detector: ProcessDetector = {
      snapshot: async () => {
        throw new Error('snapshot failed')
      }
    }

    await expect(listProcessOptions(detector)).rejects.toThrow('snapshot failed')
  })
})
