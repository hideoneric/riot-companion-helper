import { describe, expect, it, vi } from 'vitest'
import { presentWindowOnReady } from '../src/main/window-startup'

describe('presentWindowOnReady', () => {
  it('shows the main window on a normal start', () => {
    const win = {
      show: vi.fn(),
      minimize: vi.fn()
    }

    presentWindowOnReady(win, false)

    expect(win.show).toHaveBeenCalledOnce()
    expect(win.minimize).not.toHaveBeenCalled()
  })

  it('starts the main window minimized when configured', () => {
    const win = {
      show: vi.fn(),
      minimize: vi.fn()
    }

    presentWindowOnReady(win, true)

    expect(win.show).toHaveBeenCalledOnce()
    expect(win.minimize).toHaveBeenCalledOnce()
  })
})
