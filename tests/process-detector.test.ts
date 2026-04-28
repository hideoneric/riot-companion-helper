import { describe, expect, it } from 'vitest'
import { parseTasklistCsv } from '../src/main/process-detector'

describe('parseTasklistCsv', () => {
  it('normalizes process image names from tasklist CSV output', () => {
    const result = parseTasklistCsv(
      [
        '"LeagueClient.exe","1234","Console","1","120,000 K"',
        '"VALORANT.exe","2345","Console","1","250,000 K"',
        '"Blitz.exe","3456","Console","1","80,000 K"'
      ].join('\r\n')
    )

    expect(result.has('leagueclient.exe')).toBe(true)
    expect(result.has('valorant.exe')).toBe(true)
    expect(result.has('blitz.exe')).toBe(true)
  })

  it('ignores empty, localized, and malformed rows', () => {
    const result = parseTasklistCsv(
      [
        '',
        'INFO: No tasks are running which match the specified criteria.',
        '"Malformed row"',
        '"RiotClientServices.exe","4567","Console","1","60,000 K"'
      ].join('\n')
    )

    expect([...result]).toEqual(['riotclientservices.exe'])
  })

  it('handles quoted executable names that contain commas', () => {
    const result = parseTasklistCsv('"Odd,Name.exe","999","Console","1","10,000 K"')

    expect(result.has('odd,name.exe')).toBe(true)
  })
})
