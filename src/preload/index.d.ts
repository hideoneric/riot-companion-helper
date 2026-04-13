import { ElectronAPI } from '@electron-toolkit/preload'

export type UpdateStatus =
  | { status: 'checking' | 'available' | 'not-available' }
  | { status: 'downloading'; version: string; progress: number }
  | { status: 'ready'; version: string }
  | { status: 'error'; message: string }

declare global {
  interface Window {
    electron: ElectronAPI
    api: unknown
  }
}
