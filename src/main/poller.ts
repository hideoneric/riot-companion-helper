import { execSync } from 'child_process'
import { BlitzLauncher, ValorantTrackerLauncher } from './launcher'

export interface LogEntry {
  timestamp: string
  message: string
  level: 'info' | 'warn' | 'error'
}

export interface PollerState {
  leagueRunning: boolean
  blitzRunning: boolean
  valorantRunning: boolean
  valorantTrackerRunning: boolean
  monitoringEnabled: boolean
  blitzPathSet: boolean
  valorantTrackerPathSet: boolean
}

interface PollerOptions {
  launcher: BlitzLauncher
  valorantLauncher: ValorantTrackerLauncher
  onLog: (entry: LogEntry) => void
  onStateChange: (state: PollerState) => void
  onTrayNotify?: (title: string, message: string) => void
}

export class Poller {
  private leagueWasRunning = false
  private valorantWasRunning = false
  private monitoringEnabled = true
  private consecutiveErrors = 0
  private intervalHandle: ReturnType<typeof setInterval> | null = null
  private _blitzPath = ''
  private _valorantTrackerPath = ''
  private lastState: PollerState | null = null

  private broadcastIfChanged(state: PollerState) {
    const s = this.lastState
    if (s &&
      s.leagueRunning === state.leagueRunning &&
      s.blitzRunning === state.blitzRunning &&
      s.valorantRunning === state.valorantRunning &&
      s.valorantTrackerRunning === state.valorantTrackerRunning &&
      s.monitoringEnabled === state.monitoringEnabled &&
      s.blitzPathSet === state.blitzPathSet &&
      s.valorantTrackerPathSet === state.valorantTrackerPathSet
    ) return
    this.lastState = state
    this.opts.onStateChange(state)
  }

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

  private isValorantRunning(): boolean {
    const output = execSync('tasklist /FI "IMAGENAME eq VALORANT.exe" /NH', {
      encoding: 'utf8',
    }) as unknown as string
    return output.includes('VALORANT.exe')
  }

  private isBlitzRunning(): boolean {
    try {
      const out = execSync('tasklist /FI "IMAGENAME eq Blitz.exe" /NH', { encoding: 'utf8' }) as unknown as string
      return out.includes('Blitz.exe')
    } catch {
      return this.opts.launcher.launchedPid !== null
    }
  }

  tick(): void {
    if (!this.monitoringEnabled) return

    let leagueRunning: boolean
    let valorantRunning: boolean
    try {
      leagueRunning = this.isLeagueRunning()
      valorantRunning = this.isValorantRunning()
      this.consecutiveErrors = 0
    } catch {
      this.consecutiveErrors++
      if (this.consecutiveErrors === 3) {
        this.log('Process detection error — check app permissions', 'error')
        this.opts.onTrayNotify?.('Riot Companion Helper', 'Process detection error — check app permissions')
      }
      return
    }

    // ── League / Blitz ──────────────────────────────────────────
    if (leagueRunning && !this.leagueWasRunning) {
      this.log('League of Legends detected')
      if (this.opts.launcher.launchedPid) {
        this.log('Blitz.gg already running — skipping launch')
      } else if (this._blitzPath) {
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

    // ── Valorant / Valorant Tracker ─────────────────────────────
    if (valorantRunning && !this.valorantWasRunning) {
      this.log('Valorant detected')
      if (this.opts.valorantLauncher.isRunning()) {
        this.log('Valorant Tracker already running — skipping launch')
      } else if (this._valorantTrackerPath) {
        this.log('Launching Valorant Tracker')
        try {
          this.opts.valorantLauncher.launch(this._valorantTrackerPath)
          this.log('Valorant Tracker launched')
        } catch (e) {
          this.log(`Failed to launch Valorant Tracker: ${(e as Error).message}`, 'error')
        }
      }
      this.valorantWasRunning = true
    } else if (!valorantRunning && this.valorantWasRunning) {
      this.log('Valorant closed')
      this.opts.valorantLauncher.kill()
      this.log('Valorant Tracker closed')
      this.valorantWasRunning = false
    }

    this.broadcastIfChanged({
      leagueRunning,
      blitzRunning: this.isBlitzRunning(),
      valorantRunning,
      valorantTrackerRunning: this.opts.valorantLauncher.isRunning(),
      monitoringEnabled: this.monitoringEnabled,
      blitzPathSet: !!this._blitzPath,
      valorantTrackerPathSet: !!this._valorantTrackerPath,
    })
  }

  setBlitzPath(p: string) { this._blitzPath = p }
  setValorantTrackerPath(p: string) { this._valorantTrackerPath = p }

  setMonitoring(enabled: boolean) {
    this.monitoringEnabled = enabled
    if (!enabled) {
      this.log('Monitoring paused')
      this.stopInterval()
    } else {
      this.log('Monitoring resumed')
      this.tick()
    }
    this.broadcastIfChanged({
      leagueRunning: this.leagueWasRunning,
      blitzRunning: this.isBlitzRunning(),
      valorantRunning: this.valorantWasRunning,
      valorantTrackerRunning: this.opts.valorantLauncher.isRunning(),
      monitoringEnabled: enabled,
      blitzPathSet: !!this._blitzPath,
      valorantTrackerPathSet: !!this._valorantTrackerPath,
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
