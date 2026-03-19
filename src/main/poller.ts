import { execSync } from 'child_process'
import { BlitzLauncher } from './launcher'

export interface LogEntry {
  timestamp: string
  message: string
  level: 'info' | 'warn' | 'error'
}

export interface PollerState {
  leagueRunning: boolean
  blitzRunning: boolean
  monitoringEnabled: boolean
  blitzPathSet: boolean
}

interface PollerOptions {
  launcher: BlitzLauncher
  onLog: (entry: LogEntry) => void
  onStateChange: (state: PollerState) => void
  onTrayNotify?: (title: string, message: string) => void
}

export class Poller {
  private leagueWasRunning = false
  private monitoringEnabled = true
  private consecutiveErrors = 0
  private intervalHandle: ReturnType<typeof setInterval> | null = null
  private _blitzPath = ''

  constructor(private opts: PollerOptions) {}

  private log(message: string, level: LogEntry['level'] = 'info') {
    this.opts.onLog({
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
      message,
      level,
    })
  }

  private isLeagueRunning(): boolean {
    const output = execSync('tasklist /FI "IMAGENAME eq LeagueClient.exe" /NH', {
      encoding: 'utf8',
    }) as unknown as string
    return output.includes('LeagueClient.exe')
  }

  tick(): void {
    if (!this.monitoringEnabled) return

    let leagueRunning: boolean
    try {
      leagueRunning = this.isLeagueRunning()
      this.consecutiveErrors = 0
    } catch {
      this.consecutiveErrors++
      if (this.consecutiveErrors === 3) {
        this.log('Process detection error — check app permissions', 'error')
        this.opts.onTrayNotify?.('Riot Companion Helper', 'Process detection error — check app permissions')
      }
      return
    }

    if (leagueRunning && !this.leagueWasRunning) {
      this.log('League of Legends detected')
      const blitzPid = this.opts.launcher.launchedPid
      if (blitzPid) {
        this.log('Blitz.gg already running — skipping launch')
      } else {
        this.log('Launching Blitz.gg')
        try {
          this.opts.launcher.launch(this._blitzPath)
          this.log('Blitz.gg launched')
        } catch (e) {
          this.log(`Failed to launch Blitz.gg: ${(e as Error).message}`, 'error')
        }
      }
      this.leagueWasRunning = true
    } else if (!leagueRunning && this.leagueWasRunning) {
      this.log('League of Legends closed')
      this.opts.launcher.kill()
      BlitzLauncher.killByName()
      this.log('Blitz.gg closed')
      this.leagueWasRunning = false
    }

    this.opts.onStateChange({
      leagueRunning,
      blitzRunning: this.opts.launcher.launchedPid !== null,
      monitoringEnabled: this.monitoringEnabled,
      blitzPathSet: !!this._blitzPath,
    })
  }

  setBlitzPath(p: string) { this._blitzPath = p }

  setMonitoring(enabled: boolean) {
    this.monitoringEnabled = enabled
    if (!enabled) {
      this.log('Monitoring paused')
      this.stopInterval()
    } else {
      this.log('Monitoring resumed')
      this.tick()
    }
    this.opts.onStateChange({
      leagueRunning: this.leagueWasRunning,
      blitzRunning: this.opts.launcher.launchedPid !== null,
      monitoringEnabled: enabled,
      blitzPathSet: !!this._blitzPath,
    })
  }

  startInterval(seconds: number) {
    this.stopInterval()
    this.intervalHandle = setInterval(() => this.tick(), seconds * 1000)
    this.tick()
  }

  stopInterval() {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle)
      this.intervalHandle = null
    }
  }
}
