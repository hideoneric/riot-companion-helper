import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as child_process from 'child_process'

vi.mock('child_process')
vi.mock('../src/main/launcher')

import { Poller } from '../src/main/poller'
import { BlitzLauncher } from '../src/main/launcher'

describe('Poller state machine', () => {
  let poller: Poller
  let onLog: ReturnType<typeof vi.fn>
  let onState: ReturnType<typeof vi.fn>
  let mockLauncher: BlitzLauncher
  let mockPorofessorLauncher: BlitzLauncher

  beforeEach(() => {
    onLog = vi.fn()
    onState = vi.fn()
    mockLauncher = new BlitzLauncher()
    vi.mocked(mockLauncher.launch).mockImplementation(() => {})
    vi.mocked(mockLauncher.kill).mockImplementation(() => {})
    mockPorofessorLauncher = new BlitzLauncher()
    vi.mocked(mockPorofessorLauncher.launch).mockImplementation(() => {})
    vi.mocked(mockPorofessorLauncher.kill).mockImplementation(() => {})
    poller = new Poller({ launcher: mockLauncher, porofessorLauncher: mockPorofessorLauncher, onLog, onStateChange: onState })
    poller.setBlitzPath('C:\\mock\\Blitz.exe')
    vi.spyOn(child_process, 'execSync').mockReturnValue(Buffer.from(''))
  })

  const mockLeagueRunning = (running: boolean) => {
    vi.spyOn(child_process, 'execSync').mockReturnValue(
      Buffer.from(running ? 'LeagueClient.exe   1234' : 'INFO: No tasks are running')
    )
  }

  it('launches Blitz when League starts', () => {
    mockLeagueRunning(true)
    poller.tick()
    expect(mockLauncher.launch).toHaveBeenCalledOnce()
    expect(onLog).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('League of Legends detected') }))
  })

  it('does not launch Blitz twice', () => {
    mockLeagueRunning(true)
    poller.tick()
    poller.tick()
    expect(mockLauncher.launch).toHaveBeenCalledOnce()
  })

  it('kills Blitz when League stops', () => {
    mockLeagueRunning(true)
    poller.tick()
    mockLeagueRunning(false)
    poller.tick()
    expect(mockLauncher.kill).toHaveBeenCalledOnce()
  })

  it('does not tick when monitoring is disabled', () => {
    poller.setMonitoring(false)
    mockLeagueRunning(true)
    poller.tick()
    expect(mockLauncher.launch).not.toHaveBeenCalled()
  })
})
