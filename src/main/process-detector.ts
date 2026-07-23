import { execFile } from 'child_process'
import * as path from 'path'

export interface ProcessDetector {
  snapshot(): Promise<Set<string>>
}

const POWERSHELL_PATH = path.join(
  process.env.SystemRoot ?? 'C:\\Windows',
  'System32',
  'WindowsPowerShell',
  'v1.0',
  'powershell.exe'
)
const PROCESS_COMMAND =
  'Get-Process -ErrorAction SilentlyContinue | Select-Object -ExpandProperty ProcessName'

export class PowerShellProcessDetector implements ProcessDetector {
  snapshot(): Promise<Set<string>> {
    return new Promise((resolve, reject) => {
      execFile(
        POWERSHELL_PATH,
        ['-NoLogo', '-NoProfile', '-NonInteractive', '-Command', PROCESS_COMMAND],
        {
          encoding: 'utf8',
          maxBuffer: 1024 * 1024,
          timeout: 5000,
          windowsHide: true
        },
        (error, stdout) => {
          if (error) {
            reject(error)
            return
          }
          resolve(parsePowerShellProcessNames(stdout))
        }
      )
    })
  }
}

export function parsePowerShellProcessNames(output: string): Set<string> {
  return new Set(
    output
      .split(/\r?\n/)
      .map((name) => name.trim().toLowerCase())
      .filter(Boolean)
      .map((name) => (name.endsWith('.exe') ? name : `${name}.exe`))
  )
}
