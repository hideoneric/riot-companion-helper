import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as child_process from 'child_process'

vi.mock('child_process')

import { BlitzLauncher } from '../src/main/launcher'

describe('BlitzLauncher', () => {
  let launcher: BlitzLauncher

  beforeEach(() => {
    launcher = new BlitzLauncher()
    vi.clearAllMocks()
  })

  it('launches Blitz and retains PID', () => {
    const fakeProcess = { pid: 1234, on: vi.fn(), unref: vi.fn() } as any
    vi.spyOn(child_process, 'spawn').mockReturnValue(fakeProcess)
    launcher.launch('C:\\Blitz\\Blitz.exe')
    expect(launcher.launchedPid).toBe(1234)
  })

  it('does not kill if no PID retained', () => {
    const execSpy = vi.spyOn(child_process, 'execSync').mockReturnValue(Buffer.from(''))
    launcher.kill()
    expect(execSpy).not.toHaveBeenCalled()
  })

  it('kills via taskkill using retained PID', () => {
    const fakeProcess = { pid: 5678, on: vi.fn(), unref: vi.fn() } as any
    vi.spyOn(child_process, 'spawn').mockReturnValue(fakeProcess)
    const execSpy = vi.spyOn(child_process, 'execSync').mockReturnValue(Buffer.from(''))
    launcher.launch('C:\\Blitz\\Blitz.exe')
    launcher.kill()
    expect(execSpy).toHaveBeenCalledWith(expect.stringContaining('5678'))
  })
})
