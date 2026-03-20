import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  openSettings: () => ipcRenderer.send('settings:open'),
  minimize: () => ipcRenderer.send('window:minimize'),
  hideToTray: () => ipcRenderer.send('window:hide'),
  getState: () => ipcRenderer.invoke('state:get'),
  onStateUpdate: (cb: (s: unknown) => void) => {
    ipcRenderer.on('state:update', (_e, s) => cb(s))
    return () => ipcRenderer.removeAllListeners('state:update')
  },
  onLogEntry: (cb: (e: unknown) => void) => {
    ipcRenderer.on('log:entry', (_e, entry) => cb(entry))
    return () => ipcRenderer.removeAllListeners('log:entry')
  },
  getSettings: () => ipcRenderer.invoke('settings:get'),
  saveSettings: (s: unknown) => ipcRenderer.invoke('settings:save', s),
  browse: () => ipcRenderer.invoke('settings:browse'),
  onNavigate: (cb: (page: string) => void) => {
    ipcRenderer.on('navigate', (_e, page) => cb(page))
    return () => ipcRenderer.removeAllListeners('navigate')
  },
})
