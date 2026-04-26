import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockStore = vi.hoisted(() => ({
  data: {} as Record<string, unknown>
}))

// Mock electron-store before importing the module
vi.mock('electron-store', () => {
  return {
    default: vi.fn().mockImplementation(function () {
      this.get = (key: string, def: unknown) => mockStore.data[key] ?? def
      this.set = (key: string, val: unknown) => {
        mockStore.data[key] = val
      }
    })
  }
})

// Mock electron (not available in test environment)
vi.mock('electron', () => ({ app: { getPath: () => '/tmp' } }))

import { getSettings, saveSettings } from '../src/main/settings-store'

describe('settings-store', () => {
  beforeEach(() => {
    mockStore.data = {}
  })

  const fullSettings = {
    launchWithWindows: false,
    pollingInterval: 3,
    monitoringEnabled: true,
    leagueHelper: {
      appPath: 'C:\\Helpers\\LeagueHelper.exe',
      processName: 'LeagueClient.exe',
      enabled: true,
      visible: true
    },
    valorantHelper: {
      appPath: 'C:\\Helpers\\ValorantHelper.exe',
      processName: 'VALORANT.exe',
      enabled: true,
      visible: true
    },
    themeColor: '#7c5cbf'
  }

  it('returns defaults when nothing is stored', () => {
    const s = getSettings()
    expect(s.launchWithWindows).toBe(false)
    expect(s.pollingInterval).toBe(3)
    expect(s.monitoringEnabled).toBe(true)
    expect(s.leagueHelper).toEqual({
      appPath: '',
      processName: '',
      enabled: true,
      visible: true
    })
    expect(s.valorantHelper).toEqual({
      appPath: '',
      processName: '',
      enabled: true,
      visible: true
    })
  })

  it('saves and retrieves a value', () => {
    saveSettings(fullSettings)
    expect(getSettings().leagueHelper.appPath).toBe('C:\\Helpers\\LeagueHelper.exe')
    expect(getSettings().valorantHelper.processName).toBe('VALORANT.exe')
  })

  it('falls back to default polling interval when stored value is invalid', () => {
    mockStore.data.pollingInterval = 0

    expect(getSettings().pollingInterval).toBe(3)
  })

  it('preserves valid polling intervals', () => {
    mockStore.data.pollingInterval = 10

    expect(getSettings().pollingInterval).toBe(10)
  })

  it('falls back to default theme color when stored value is invalid', () => {
    mockStore.data.themeColor = 'purple'

    expect(getSettings().themeColor).toBe('#7c5cbf')
  })
})
