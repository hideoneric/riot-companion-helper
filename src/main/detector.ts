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

export function detectOverwolfPath(): string | null {
  const overwolfRoot = process.env.LOCALAPPDATA
    ? path.join(process.env.LOCALAPPDATA, 'Overwolf')
    : null
  if (!overwolfRoot || !fs.existsSync(overwolfRoot)) return null

  // Overwolf installs into versioned subdirectories — find the latest one
  let entries: string[]
  try {
    entries = fs.readdirSync(overwolfRoot)
  } catch {
    return null
  }

  // Filter to version-like dirs (e.g. "0.220.0.14") and sort descending
  const versionDirs = entries
    .filter((e) => /^\d+\.\d+/.test(e))
    .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))

  for (const dir of versionDirs) {
    const candidate = path.join(overwolfRoot, dir, 'Overwolf.exe')
    if (fs.existsSync(candidate)) return candidate
  }
  return null
}
