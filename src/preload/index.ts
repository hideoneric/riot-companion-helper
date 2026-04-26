import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  openSettings: () => ipcRenderer.send('settings:open'),
  minimize: () => ipcRenderer.send('window:minimize'),
  hideToTray: () => ipcRenderer.send('window:hide'),
  getState: () => ipcRenderer.invoke('state:get'),
  onStateUpdate: (cb: (s: unknown) => void): (() => void) => {
    const handler = (_e: unknown, s: unknown): void => cb(s)
    ipcRenderer.on('state:update', handler)
    return () => ipcRenderer.removeListener('state:update', handler)
  },
  onLogEntry: (cb: (e: unknown) => void): (() => void) => {
    const handler = (_e: unknown, entry: unknown): void => cb(entry)
    ipcRenderer.on('log:entry', handler)
    return () => ipcRenderer.removeListener('log:entry', handler)
  },
  getSettings: () => ipcRenderer.invoke('settings:get'),
  saveSettings: (s: unknown) => ipcRenderer.invoke('settings:save', s),
  browse: () => ipcRenderer.invoke('settings:browse'),
  listProcesses: () => ipcRenderer.invoke('processes:list'),
  onNavigate: (cb: (page: string) => void): (() => void) => {
    const handler = (_e: unknown, page: string): void => cb(page)
    ipcRenderer.on('navigate', handler)
    return () => ipcRenderer.removeListener('navigate', handler)
  },
  onUpdateStatus: (cb: (s: unknown) => void): (() => void) => {
    const handler = (_e: unknown, s: unknown): void => cb(s)
    ipcRenderer.on('update:status', handler)
    return () => ipcRenderer.removeListener('update:status', handler)
  },
  installUpdate: () => ipcRenderer.send('update:install')
})
