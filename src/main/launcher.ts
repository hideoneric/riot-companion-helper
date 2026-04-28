import { execFile, spawn } from 'child_process'
import type { ChildProcess } from 'child_process'

export class BlitzLauncher {
  private process: ChildProcess | null = null

  get launchedPid(): number | null {
    return this.process?.pid ?? null
  }

  launch(blitzPath: string): void {
    try {
      const isShortcut = blitzPath.toLowerCase().endsWith('.lnk')
      // .lnk shortcuts must be launched via cmd /c start; direct spawn won't resolve them
      const [cmd, args] = isShortcut
        ? ['cmd', ['/c', 'start', '', blitzPath]]
        : [blitzPath, [] as string[]]
      this.process = spawn(cmd, args, { detached: true, stdio: 'ignore' })
      this.process.unref()
      this.process.on('exit', () => {
        this.process = null
      })
    } catch (err) {
      this.process = null
      throw err
    }
  }

  async kill(): Promise<void> {
    if (this.process?.pid) {
      const pid = this.process.pid
      this.process = null
      try {
        await runTaskkill(['/PID', String(pid), '/F', '/T'])
      } catch {
        // Process may have already exited
      }
    }
  }

  /** Force-kill by image name — used when Blitz was running before we launched it */
  static async killByName(): Promise<void> {
    try {
      await runTaskkill(['/IM', 'Blitz.exe', '/F'])
    } catch {
      // Not running — ignore
    }
  }
}

function runTaskkill(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    execFile('taskkill', args, { windowsHide: true }, (error) => {
      if (error) {
        reject(error)
        return
      }

      resolve()
    })
  })
}
