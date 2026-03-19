import { describe, it, expect, vi } from 'vitest'
import * as fs from 'fs'

vi.mock('fs')

import { detectBlitzPath } from '../src/main/detector'

const mockExists = (paths: string[]) => {
  vi.spyOn(fs, 'existsSync').mockImplementation((p) => paths.includes(p as string))
}

describe('detectBlitzPath', () => {
  it('returns null when no path exists', () => {
    mockExists([])
    expect(detectBlitzPath()).toBeNull()
  })

  it('returns the first matching path', () => {
    const target = 'C:\\Users\\test\\AppData\\Local\\Blitz\\Blitz.exe'
    mockExists([target])
    process.env.LOCALAPPDATA = 'C:\\Users\\test\\AppData\\Local'
    expect(detectBlitzPath()).toBe(target)
  })
})
