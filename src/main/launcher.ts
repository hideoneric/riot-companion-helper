import { spawn, execSync } from 'child_process'
import type { ChildProcess } from 'child_process'

export class BlitzLauncher {
  private process: ChildProcess | null = null

  get launchedPid(): number | null {
    return this.process?.pid ?? null
  }

  launch(blitzPath: string): void {
    try {
      this.process = spawn(blitzPath, [], { detached: true, stdio: 'ignore' })
      this.process.unref()
      this.process.on('exit', () => { this.process = null })
    } catch (err) {
      this.process = null
      throw err
    }
  }

  kill(): void {
    if (this.process?.pid) {
      try {
        execSync(`taskkill /PID ${this.process.pid} /F /T`)
      } catch {
        // Process may have already exited
      }
      this.process = null
    }
  }

  /** Force-kill by image name — used when Blitz was running before we launched it */
  static killByName(): void {
    try {
      execSync('taskkill /IM Blitz.exe /F')
    } catch {
      // Not running — ignore
    }
  }
}

const TRACKER_APP_ID = 'hmkibiljlncohohombieopgahkpfoklkfkojmgoo'

export class ValorantTrackerLauncher {
  private process: ChildProcess | null = null

  get launchedPid(): number | null {
    return this.process?.pid ?? null
  }

  launch(overwolfPath: string): void {
    try {
      this.process = spawn(overwolfPath, ['-launchapp', TRACKER_APP_ID], {
        detached: true,
        stdio: 'ignore',
      })
      this.process.unref()
      this.process.on('exit', () => { this.process = null })
    } catch (err) {
      this.process = null
      throw err
    }
  }

  kill(): void {
    // Stop the OverwolfBrowser.exe window whose title contains "Valorant Tracker"
    try {
      execSync(
        `powershell -NoProfile -Command "Get-Process OverwolfBrowser -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowTitle -like '*Valorant Tracker*' } | Stop-Process -Force"`,
        { stdio: 'ignore' }
      )
    } catch {
      // Not running — ignore
    }
    this.process = null
  }

  isRunning(): boolean {
    try {
      const out = execSync(
        `powershell -NoProfile -Command "(Get-Process OverwolfBrowser -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowTitle -like '*Valorant Tracker*' }).Count"`,
        { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }
      ) as unknown as string
      return parseInt(out.trim(), 10) > 0
    } catch {
      return this.process !== null
    }
  }
}
