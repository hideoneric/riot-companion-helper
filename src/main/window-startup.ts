type StartupWindow = {
  show: () => void
  minimize: () => void
}

export function presentWindowOnReady(win: StartupWindow, startMinimized: boolean): void {
  win.show()

  if (startMinimized) {
    win.minimize()
  }
}
