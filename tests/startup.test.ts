import { beforeEach, describe, expect, it, vi } from 'vitest'

const { setLoginItemSettings } = vi.hoisted(() => ({
  setLoginItemSettings: vi.fn()
}))

vi.mock('electron', () => ({
  app: { setLoginItemSettings }
}))

import { setLaunchWithWindows } from '../src/main/startup'

describe('setLaunchWithWindows', () => {
  beforeEach(() => vi.clearAllMocks())

  it('uses Electron login-item registration', () => {
    setLaunchWithWindows(true)
    expect(setLoginItemSettings).toHaveBeenCalledWith({
      openAtLogin: true,
      path: process.execPath
    })
  })

  it('disables Electron login-item registration', () => {
    setLaunchWithWindows(false)
    expect(setLoginItemSettings).toHaveBeenCalledWith({
      openAtLogin: false,
      path: process.execPath
    })
  })
})
