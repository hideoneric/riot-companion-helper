import { describe, expect, it } from 'vitest'
import { getCompanionDisplayName } from '../src/renderer/src/lib/companion-display'

describe('companion display names', () => {
  it('uses a manual name before deriving from the path', () => {
    expect(getCompanionDisplayName('C:\\Apps\\Blitz.exe', 'Rank Helper')).toBe('Rank Helper')
  })

  it('derives a readable name from exe and shortcut paths', () => {
    expect(getCompanionDisplayName('C:\\Apps\\Blitz.exe', '')).toBe('Blitz')
    expect(getCompanionDisplayName('C:\\Users\\Me\\Desktop\\Outplayed.lnk', '')).toBe('Outplayed')
  })

  it('falls back to a provided name when no path can be detected', () => {
    expect(getCompanionDisplayName('', '', 'Porofessor')).toBe('Porofessor')
  })
})
