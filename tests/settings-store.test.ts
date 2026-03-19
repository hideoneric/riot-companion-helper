import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock electron-store before importing the module
vi.mock('electron-store', () => {
  const store: Record<string, unknown> = {}
  return {
    default: vi.fn().mockImplementation(function () {
      this.get = (key: string, def: unknown) => store[key] ?? def
      this.set = (key: string, val: unknown) => { store[key] = val }
    }),
  }
})

// Mock electron (not available in test environment)
vi.mock('electron', () => ({ app: { getPath: () => '/tmp' } }))

import { getSettings, saveSettings } from '../src/main/settings-store'

describe('settings-store', () => {
  it('returns defaults when nothing is stored', () => {
    const s = getSettings()
    expect(s.blitzPath).toBe('')
    expect(s.launchWithWindows).toBe(false)
    expect(s.pollingInterval).toBe(3)
    expect(s.monitoringEnabled).toBe(true)
  })

  it('saves and retrieves a value', () => {
    saveSettings({ blitzPath: 'C:\\Blitz\\Blitz.exe', launchWithWindows: false, pollingInterval: 3, monitoringEnabled: true })
    expect(getSettings().blitzPath).toBe('C:\\Blitz\\Blitz.exe')
  })
})
