import { execFile } from 'child_process'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  parsePowerShellProcessNames,
  PowerShellProcessDetector
} from '../src/main/process-detector'

vi.mock('child_process', () => ({ execFile: vi.fn() }))

describe('PowerShellProcessDetector', () => {
  beforeEach(() => vi.clearAllMocks())

  it('normalizes newline-delimited process names', () => {
    expect([
      ...parsePowerShellProcessNames('LeagueClient.exe\r\nVALORANT.exe\r\nBlitz.exe\r\n')
    ]).toEqual(['leagueclient.exe', 'valorant.exe', 'blitz.exe'])
  })

  it('adds exe suffix and removes empty duplicates', () => {
    expect([...parsePowerShellProcessNames('Blitz\n\nblitz\nRiotClientServices.exe\n')]).toEqual([
      'blitz.exe',
      'riotclientservices.exe'
    ])
  })

  it('runs hidden Windows PowerShell without a profile', async () => {
    vi.mocked(execFile).mockImplementationOnce((file, args, options, callback) => {
      expect(String(file).toLowerCase()).toMatch(/powershell\.exe$/)
      expect(args).toEqual(
        expect.arrayContaining(['-NoLogo', '-NoProfile', '-NonInteractive', '-Command'])
      )
      expect(options).toEqual(expect.objectContaining({ windowsHide: true, timeout: 5000 }))
      callback?.(null, 'LeagueClient\n', '')
      return undefined as never
    })

    await expect(new PowerShellProcessDetector().snapshot()).resolves.toEqual(
      new Set(['leagueclient.exe'])
    )
  })

  it('preserves execution failures', async () => {
    vi.mocked(execFile).mockImplementationOnce((_file, _args, _options, callback) => {
      callback?.(new Error('PowerShell denied'), '', '')
      return undefined as never
    })

    await expect(new PowerShellProcessDetector().snapshot()).rejects.toThrow('PowerShell denied')
  })
})
