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
  let leagueLauncher: BlitzLauncher
  let valorantLauncher: BlitzLauncher

  beforeEach(() => {
    onLog = vi.fn()
    onState = vi.fn()
    leagueLauncher = new BlitzLauncher()
    vi.mocked(leagueLauncher.launch).mockImplementation(() => {})
    vi.mocked(leagueLauncher.kill).mockImplementation(() => {})
    valorantLauncher = new BlitzLauncher()
    vi.mocked(valorantLauncher.launch).mockImplementation(() => {})
    vi.mocked(valorantLauncher.kill).mockImplementation(() => {})
    poller = new Poller({
      leagueLauncher,
      valorantLauncher,
      onLog,
      onStateChange: onState
    })
    vi.spyOn(child_process, 'execSync').mockReturnValue(Buffer.from(''))
  })

  const setProcessList = (processNames: string[]): void => {
    vi.spyOn(child_process, 'execSync').mockImplementation((command) => {
      const commandText = String(command)
      const match = commandText.match(/IMAGENAME eq ([^"]+)/)
      const processName = match?.[1]
      return Buffer.from(processName && processNames.includes(processName) ? processName : '')
    })
  }

  beforeEach(() => {
    poller.setLeagueHelper({
      appPath: 'C:\\Helpers\\LeagueHelper.exe',
      processName: 'LeagueHelper.exe',
      enabled: true,
      visible: true
    })
    poller.setValorantHelper({
      appPath: 'C:\\Helpers\\ValorantHelper.exe',
      processName: 'ValorantHelper.exe',
      enabled: true,
      visible: true
    })
  })

  it('launches League helper when League starts', () => {
    setProcessList(['LeagueClient.exe'])
    poller.tick()
    expect(leagueLauncher.launch).toHaveBeenCalledWith('C:\\Helpers\\LeagueHelper.exe')
    expect(valorantLauncher.launch).not.toHaveBeenCalled()
  })

  it('launches Valorant helper when Valorant starts', () => {
    setProcessList(['VALORANT.exe'])
    poller.tick()
    expect(valorantLauncher.launch).toHaveBeenCalledWith('C:\\Helpers\\ValorantHelper.exe')
    expect(leagueLauncher.launch).not.toHaveBeenCalled()
  })

  it('does not launch disabled helpers', () => {
    poller.setLeagueHelper({
      appPath: 'C:\\Helpers\\LeagueHelper.exe',
      processName: 'LeagueHelper.exe',
      enabled: false,
      visible: true
    })
    setProcessList(['LeagueClient.exe'])
    poller.tick()
    expect(leagueLauncher.launch).not.toHaveBeenCalled()
  })

  it('does not launch helpers missing path or process name', () => {
    poller.setLeagueHelper({
      appPath: '',
      processName: 'LeagueHelper.exe',
      enabled: true,
      visible: true
    })
    poller.setValorantHelper({
      appPath: 'C:\\Helpers\\ValorantHelper.exe',
      processName: '',
      enabled: true,
      visible: true
    })
    setProcessList(['LeagueClient.exe', 'VALORANT.exe'])
    poller.tick()
    expect(leagueLauncher.launch).not.toHaveBeenCalled()
    expect(valorantLauncher.launch).not.toHaveBeenCalled()
  })

  it('closes only the matching helper when its configured process stops', () => {
    setProcessList(['LeagueClient.exe', 'VALORANT.exe'])
    poller.tick()
    setProcessList(['VALORANT.exe'])
    poller.tick()
    expect(leagueLauncher.kill).toHaveBeenCalledOnce()
    expect(valorantLauncher.kill).not.toHaveBeenCalled()
  })

  it('does not launch when the helper process is already running', () => {
    setProcessList(['LeagueClient.exe', 'LeagueHelper.exe'])
    poller.tick()
    expect(leagueLauncher.launch).not.toHaveBeenCalled()
    expect(onLog).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'League helper already running - skipping launch' })
    )
  })

  it('does not tick when monitoring is disabled', () => {
    poller.setMonitoring(false)
    setProcessList(['LeagueClient.exe'])
    poller.tick()
    expect(leagueLauncher.launch).not.toHaveBeenCalled()
  })
})
