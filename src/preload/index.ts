import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  openSettings: () => ipcRenderer.send('settings:open'),
  minimize: () => ipcRenderer.send('window:minimize'),
  hideToTray: () => ipcRenderer.send('window:hide'),
  getState: () => ipcRenderer.invoke('state:get'),
  onStateUpdate: (cb: (s: unknown) => void) => {
    const handler = (_e: unknown, s: unknown) => cb(s)
    ipcRenderer.on('state:update', handler)
    return () => ipcRenderer.removeListener('state:update', handler)
  },
  onLogEntry: (cb: (e: unknown) => void) => {
    const handler = (_e: unknown, entry: unknown) => cb(entry)
    ipcRenderer.on('log:entry', handler)
    return () => ipcRenderer.removeListener('log:entry', handler)
  },
  getSettings: () => ipcRenderer.invoke('settings:get'),
  saveSettings: (s: unknown) => ipcRenderer.invoke('settings:save', s),
  browse: () => ipcRenderer.invoke('settings:browse'),
  onNavigate: (cb: (page: string) => void) => {
    const handler = (_e: unknown, page: string) => cb(page)
    ipcRenderer.on('navigate', handler)
    return () => ipcRenderer.removeListener('navigate', handler)
  },
  onUpdateStatus: (cb: (s: unknown) => void) => {
    const handler = (_e: unknown, s: unknown) => cb(s)
    ipcRenderer.on('update:status', handler)
    return () => ipcRenderer.removeListener('update:status', handler)
  },
  installUpdate: () => ipcRenderer.send('update:install'),
})
