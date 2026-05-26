import { describe, it, expect, vi } from 'vitest'

// Mock electron-store before importing the module
vi.mock('electron-store', () => {
  const store: Record<string, unknown> = {}
  return {
    default: vi.fn().mockImplementation(function () {
      this.get = (key: string, def: unknown) => store[key] ?? def
      this.set = (key: string, val: unknown) => {
        store[key] = val
      }
    })
  }
})

// Mock electron (not available in test environment)
vi.mock('electron', () => ({ app: { getPath: () => '/tmp' } }))

import { getSettings, saveSettings } from '../src/main/settings-store'

describe('settings-store', () => {
  it('returns defaults when nothing is stored', () => {
    const s = getSettings()
    expect(s.blitzPath).toBe('')
    expect(s.blitzName).toBe('')
    expect(s.launchWithWindows).toBe(false)
    expect(s.startMinimized).toBe(false)
    expect(s.pollingInterval).toBe(3)
    expect(s.monitoringEnabled).toBe(true)
    expect(s.helpers).toHaveLength(2)
    expect(s.helpers[0].displayName).toBe('')
    expect(s.helpers[0].enabled).toBe(false)
  })

  it('saves and retrieves a value', () => {
    saveSettings({
      blitzPath: 'C:\\Blitz\\Blitz.exe',
      blitzName: 'Blitz',
      launchWithWindows: false,
      startMinimized: true,
      pollingInterval: 3,
      monitoringEnabled: true,
      leagueEnabled: true,
      valorantEnabled: true,
      blitzEnabled: true,
      porofessorPath: '',
      porofessorName: '',
      porofessorEnabled: true,
      blitzVisible: true,
      porofessorVisible: true,
      themeColor: '#ff4058',
      helpers: [
        {
          id: 'helper-1',
          path: 'C:\\Blitz\\Blitz.exe',
          displayName: 'Blitz',
          detectedName: 'Blitz',
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
    })
    expect(getSettings().blitzPath).toBe('C:\\Blitz\\Blitz.exe')
    expect(getSettings().blitzName).toBe('Blitz')
    expect(getSettings().startMinimized).toBe(true)
    expect(getSettings().themeColor).toBe('#d9e6ff')
  })

  it('keeps legacy settings compatible when helpers are missing', () => {
    saveSettings({
      blitzPath: 'C:\\Legacy\\Helper.exe',
      blitzName: 'Legacy Helper',
      launchWithWindows: false,
      startMinimized: false,
      pollingInterval: 3,
      monitoringEnabled: true,
      leagueEnabled: true,
      valorantEnabled: true,
      blitzEnabled: true,
      porofessorPath: '',
      porofessorName: '',
      porofessorEnabled: true,
      blitzVisible: true,
      porofessorVisible: true,
      themeColor: '#ff4058'
    } as ReturnType<typeof getSettings>)

    const settings = getSettings()
    expect(settings.helpers[0].path).toBe('C:\\Legacy\\Helper.exe')
    expect(settings.helpers[0].displayName).toBe('Legacy Helper')
    expect(settings.helpers[0].enabled).toBe(true)
  })
})
