import * as fs from 'fs'
import * as path from 'path'

export function detectBlitzPath(): string | null {
  const candidateDirs = [
    process.env.LOCALAPPDATA,
    process.env.PROGRAMFILES,
    process.env['PROGRAMFILES(X86)'],
  ]
  for (const dir of candidateDirs) {
    if (!dir) continue
    const candidate = path.join(dir, 'Blitz', 'Blitz.exe')
    if (fs.existsSync(candidate)) return candidate
  }
  return null
}
