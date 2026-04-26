import { ElectronAPI } from '@electron-toolkit/preload'

export type UpdateStatus =
  | { status: 'checking' | 'available' | 'not-available' }
  | { status: 'downloading'; version: string; progress: number }
  | { status: 'ready'; version: string }
  | { status: 'error'; message: string }

export interface ProcessOption {
  name: string
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: unknown
  }
}
