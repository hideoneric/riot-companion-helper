type StartupWindow = {
  show: () => void
}

export function presentWindowOnReady(win: StartupWindow, startMinimized: boolean): void {
  if (!startMinimized) win.show()
}
