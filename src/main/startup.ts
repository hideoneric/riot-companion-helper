import { execSync } from 'child_process'
import { app } from 'electron'

const REG_KEY = 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run'
const APP_NAME = 'RiotCompanionHelper'

export function setLaunchWithWindows(enabled: boolean): void {
  const exePath = app.getPath('exe')
  if (enabled) {
    execSync(`reg add "${REG_KEY}" /v "${APP_NAME}" /t REG_SZ /d "${exePath}" /f`)
  } else {
    try {
      execSync(`reg delete "${REG_KEY}" /v "${APP_NAME}" /f`)
    } catch {
      // Key didn't exist — ignore
    }
  }
}
