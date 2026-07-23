import { describe, it, expect, vi, beforeEach } from 'vitest'
vi.mock('../src/main/launcher')

import { Poller } from '../src/main/poller'
import { BlitzLauncher } from '../src/main/launcher'
import type { ProcessDetector } from '../src/main/process-detector'

describe('Poller state machine', () => {
  let poller: Poller
  let onLog: ReturnType<typeof vi.fn>
  let onState: ReturnType<typeof vi.fn>
  let mockLauncher: BlitzLauncher
  let mockPorofessorLauncher: BlitzLauncher
  let processes: Set<string>
  let detector: ProcessDetector

  beforeEach(() => {
    onLog = vi.fn()
    onState = vi.fn()
    mockLauncher = new BlitzLauncher()
    vi.mocked(mockLauncher.launch).mockImplementation(() => {})
    vi.mocked(mockLauncher.kill).mockImplementation(() => {})
    mockPorofessorLauncher = new BlitzLauncher()
    vi.mocked(mockPorofessorLauncher.launch).mockImplementation(() => {})
    vi.mocked(mockPorofessorLauncher.kill).mockImplementation(() => {})
    processes = new Set()
    detector = {
      snapshot: vi.fn(async () => processes)
    }
    poller = new Poller({
      launcher: mockLauncher,
      porofessorLauncher: mockPorofessorLauncher,
      processDetector: detector,
      onLog,
      onStateChange: onState
    })
    poller.setBlitzPath('C:\\mock\\Blitz.exe')
  })

  const setRunning = (...names: string[]) => {
    processes = new Set(names.map((name) => name.toLowerCase()))
  }

  it('launches Blitz when League starts', async () => {
    setRunning('LeagueClient.exe')
    await poller.tick()
    expect(mockLauncher.launch).toHaveBeenCalledOnce()
    expect(onLog).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('League of Legends detected') })
    )
  })

  it('does not launch Blitz twice', async () => {
    setRunning('LeagueClient.exe')
    await poller.tick()
    await poller.tick()
    expect(mockLauncher.launch).toHaveBeenCalledOnce()
  })

  it('kills Blitz when League stops', async () => {
    setRunning('LeagueClient.exe')
    await poller.tick()
    setRunning()
    await poller.tick()
    expect(mockLauncher.kill).toHaveBeenCalledOnce()
  })

  it('does not tick when monitoring is disabled', async () => {
    poller.setMonitoring(false)
    setRunning('LeagueClient.exe')
    await poller.tick()
    expect(mockLauncher.launch).not.toHaveBeenCalled()
  })

  it('does not overlap process snapshots when a tick is already running', async () => {
    let resolveSnapshot: (value: Set<string>) => void = () => {}
    detector.snapshot = vi.fn(
      () =>
        new Promise<Set<string>>((resolve) => {
          resolveSnapshot = resolve
        })
    )

    const firstTick = poller.tick()
    const secondTick = poller.tick()

    expect(detector.snapshot).toHaveBeenCalledOnce()
    await expect(secondTick).resolves.toBeUndefined()
    resolveSnapshot(new Set(['leagueclient.exe']))
    await firstTick
  })

  it('does not broadcast unchanged state on repeated ticks', async () => {
    setRunning()

    await poller.tick()
    await poller.tick()

    expect(onState).toHaveBeenCalledOnce()
  })

  it('settings setters do not query processes immediately', () => {
    poller.setBlitzEnabled(false)
    poller.setPorofessorEnabled(false)
    poller.setMonitoring(false)
    poller.setMonitoring(true)

    expect(detector.snapshot).not.toHaveBeenCalled()
  })

  it('detects secondary helper by configured executable basename', async () => {
    poller.setPorofessorPath('C:\\Apps\\Porofessor.exe')
    setRunning('Porofessor.exe')

    await poller.tick()

    expect(onState).toHaveBeenLastCalledWith(expect.objectContaining({ porofessorRunning: true }))
  })

  it('recognizes an externally started helper selected for a shortcut', async () => {
    poller.setPorofessorPath('C:\\Start Menu\\Valorant Tracker.lnk')
    poller.setPorofessorProcessName('Overwolf.exe')
    setRunning('Overwolf.exe')

    await poller.tick()

    expect(onState).toHaveBeenLastCalledWith(
      expect.objectContaining({ porofessorRunning: true })
    )
    expect(mockPorofessorLauncher.launch).not.toHaveBeenCalled()
  })

  it('recognizes an externally started primary helper selected for a shortcut', async () => {
    poller.setBlitzPath('C:\\Start Menu\\Primary Helper.lnk')
    poller.setBlitzProcessName('PrimaryHelper.exe')
    setRunning('LeagueClient.exe', 'PrimaryHelper.exe')

    await poller.tick()

    expect(onState).toHaveBeenLastCalledWith(expect.objectContaining({ blitzRunning: true }))
    expect(mockLauncher.launch).not.toHaveBeenCalled()
  })

  it('broadcasts Blitz as stopped after closing it from a stale process snapshot', async () => {
    setRunning('LeagueClient.exe', 'Blitz.exe')
    await poller.tick()

    setRunning('Blitz.exe')
    await poller.tick()

    expect(onState).toHaveBeenLastCalledWith(expect.objectContaining({ blitzRunning: false }))
  })

  it('logs the process detector error after three consecutive failures', async () => {
    vi.mocked(detector.snapshot).mockRejectedValue(new Error('PowerShell denied'))

    await poller.tick()
    await poller.tick()
    await poller.tick()

    expect(onLog).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'error',
        message: expect.stringContaining('PowerShell denied')
      })
    )
  })
})
