import { app } from 'electron'

export function setLaunchWithWindows(enabled: boolean): void {
  app.setLoginItemSettings({ openAtLogin: enabled, path: process.execPath })
}
