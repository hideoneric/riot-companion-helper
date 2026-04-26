import { describe, expect, it, vi } from 'vitest'
import * as child_process from 'child_process'

vi.mock('child_process')

import { listRunningProcesses, parseTasklistCsv } from '../src/main/process-list'

describe('process-list', () => {
  it('parses tasklist csv into sorted unique process options', () => {
    const output = [
      '"LeagueClient.exe","123","Console","1","100 K"',
      '"VALORANT.exe","456","Console","1","100 K"',
      '"LeagueClient.exe","789","Console","1","100 K"'
    ].join('\r\n')

    expect(parseTasklistCsv(output)).toEqual([
      { name: 'LeagueClient.exe' },
      { name: 'VALORANT.exe' }
    ])
  })

  it('returns an empty list when tasklist cannot be read', () => {
    vi.spyOn(child_process, 'execSync').mockImplementation(() => {
      throw new Error('Access denied')
    })

    expect(listRunningProcesses()).toEqual([])
  })
})
