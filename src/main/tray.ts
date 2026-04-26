import { Tray, Menu, nativeImage, app } from 'electron'

export function createTray(
  iconPath: string,
  onOpen: () => void,
  onToggleMonitoring: () => void,
  isMonitoring: () => boolean
): Tray {
  const icon = nativeImage.createFromPath(iconPath)
  const tray = new Tray(icon)
  tray.setToolTip('Riot Companion Helper — Monitoring')

  const rebuild = (): void => {
    const monitoring = isMonitoring()
    tray.setContextMenu(
      Menu.buildFromTemplate([
        { label: 'Open', click: onOpen },
        {
          label: monitoring ? 'Pause Monitoring' : 'Resume Monitoring',
          click: () => {
            onToggleMonitoring()
            rebuild()
          }
        },
        { type: 'separator' },
        { label: 'Quit', click: () => app.quit() }
      ])
    )
    tray.setToolTip(`Riot Companion Helper — ${monitoring ? 'Monitoring' : 'Paused'}`)
  }

  rebuild()
  tray.on('double-click', onOpen)

  return tray
}
