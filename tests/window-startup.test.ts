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

  it('keeps the main window hidden for background startup', () => {
    const win = {
      show: vi.fn(),
      minimize: vi.fn()
    }

    presentWindowOnReady(win, true)

    expect(win.show).not.toHaveBeenCalled()
    expect(win.minimize).not.toHaveBeenCalled()
  })
})
