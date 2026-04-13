import { execSync } from 'child_process'
import * as path from 'path'
import { BlitzLauncher } from './launcher'

export interface LogEntry {
  timestamp: string
  message: string
  level: 'info' | 'warn' | 'error'
}

export interface PollerState {
  leagueRunning: boolean
  blitzRunning: boolean
  valorantRunning: boolean
  monitoringEnabled: boolean
  blitzPathSet: boolean
  leagueEnabled: boolean
  valorantEnabled: boolean
  blitzEnabled: boolean
  porofessorRunning: boolean
  porofessorPathSet: boolean
  porofessorEnabled: boolean
}

interface PollerOptions {
  launcher: BlitzLauncher
  porofessorLauncher: BlitzLauncher
  onLog: (entry: LogEntry) => void
  onStateChange: (state: PollerState) => void
  onTrayNotify?: (title: string, message: string) => void
}

export class Poller {
  private leagueWasRunning = false
  private valorantWasRunning = false
  private monitoringEnabled = true
  private leagueEnabled = true
  private valorantEnabled = true
  private blitzEnabled = true
  private anyEnabledWasRunning = false
  private consecutiveErrors = 0
  private intervalHandle: ReturnType<typeof setInterval> | null = null
  private _blitzPath = ''
  private _porofessorPath = ''
  private porofessorEnabled = true
  private leagueWasRunningForPoro = false
  private lastState: PollerState | null = null

  private broadcastIfChanged(state: PollerState) {
    const s = this.lastState
    if (s &&
      s.leagueRunning === state.leagueRunning &&
      s.blitzRunning === state.blitzRunning &&
      s.valorantRunning === state.valorantRunning &&
      s.monitoringEnabled === state.monitoringEnabled &&
      s.blitzPathSet === state.blitzPathSet &&
      s.leagueEnabled === state.leagueEnabled &&
      s.valorantEnabled === state.valorantEnabled &&
      s.blitzEnabled === state.blitzEnabled &&
      s.porofessorRunning === state.porofessorRunning &&
      s.porofessorPathSet === state.porofessorPathSet &&
      s.porofessorEnabled === state.porofessorEnabled
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

  private isPorofessorRunning(): boolean {
    if (!this._porofessorPath) return false
    const exeName = path.basename(this._porofessorPath)
    if (!exeName.toLowerCase().endsWith('.exe')) {
      return this.opts.porofessorLauncher.launchedPid !== null
    }
    try {
      const out = execSync(`tasklist /FI "IMAGENAME eq ${exeName}" /NH`, { encoding: 'utf8' }) as unknown as string
      return out.includes(exeName)
    } catch {
      return this.opts.porofessorLauncher.launchedPid !== null
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

    // Log game transitions
    if (leagueRunning && !this.leagueWasRunning) this.log('League of Legends detected')
    else if (!leagueRunning && this.leagueWasRunning) this.log('League of Legends closed')
    if (valorantRunning && !this.valorantWasRunning) this.log('Valorant detected')
    else if (!valorantRunning && this.valorantWasRunning) this.log('Valorant closed')

    // Blitz: launch when any *enabled* game starts, kill when all enabled games stop
    const anyEnabledRunning =
      (leagueRunning && this.leagueEnabled) ||
      (valorantRunning && this.valorantEnabled)

    if (anyEnabledRunning && !this.anyEnabledWasRunning) {
      if (this.opts.launcher.launchedPid) {
        this.log('Blitz.gg already running — skipping launch')
      } else if (this._blitzPath && this.blitzEnabled) {
        this.log('Launching Blitz.gg')
        try {
          this.opts.launcher.launch(this._blitzPath)
          this.log('Blitz.gg launched')
        } catch (e) {
          this.log(`Failed to launch Blitz.gg: ${(e as Error).message}`, 'error')
        }
      }
    } else if (!anyEnabledRunning && this.anyEnabledWasRunning) {
      this.opts.launcher.kill()
      BlitzLauncher.killByName()
      this.log('Blitz.gg closed')
    }

    // Porofessor: launch when league (and leagueEnabled) starts, kill when it stops
    const leagueEnabledAndRunning = leagueRunning && this.leagueEnabled
    if (leagueEnabledAndRunning && !this.leagueWasRunningForPoro) {
      if (this.opts.porofessorLauncher.launchedPid) {
        this.log('Porofessor already running — skipping launch')
      } else if (this._porofessorPath && this.porofessorEnabled) {
        this.log('Launching Porofessor')
        try {
          this.opts.porofessorLauncher.launch(this._porofessorPath)
          this.log('Porofessor launched')
        } catch (e) {
          this.log(`Failed to launch Porofessor: ${(e as Error).message}`, 'error')
        }
      }
    } else if (!leagueEnabledAndRunning && this.leagueWasRunningForPoro) {
      this.opts.porofessorLauncher.kill()
      this.log('Porofessor closed')
    }

    this.leagueWasRunning = leagueRunning
    this.valorantWasRunning = valorantRunning
    this.anyEnabledWasRunning = anyEnabledRunning
    this.leagueWasRunningForPoro = leagueEnabledAndRunning

    this.broadcastIfChanged({
      leagueRunning,
      blitzRunning: this.isBlitzRunning(),
      valorantRunning,
      monitoringEnabled: this.monitoringEnabled,
      blitzPathSet: !!this._blitzPath,
      leagueEnabled: this.leagueEnabled,
      valorantEnabled: this.valorantEnabled,
      blitzEnabled: this.blitzEnabled,
      porofessorRunning: this.isPorofessorRunning(),
      porofessorPathSet: !!this._porofessorPath,
      porofessorEnabled: this.porofessorEnabled,
    })
  }

  setBlitzPath(p: string) { this._blitzPath = p }

  setBlitzEnabled(enabled: boolean) {
    this.blitzEnabled = enabled
    if (!enabled) {
      this.opts.launcher.kill()
      BlitzLauncher.killByName()
      this.log('Blitz.gg disabled')
    }
    this.broadcastIfChanged({
      leagueRunning: this.leagueWasRunning,
      blitzRunning: this.isBlitzRunning(),
      valorantRunning: this.valorantWasRunning,
      monitoringEnabled: this.monitoringEnabled,
      blitzPathSet: !!this._blitzPath,
      leagueEnabled: this.leagueEnabled,
      valorantEnabled: this.valorantEnabled,
      blitzEnabled: this.blitzEnabled,
      porofessorRunning: this.isPorofessorRunning(),
      porofessorPathSet: !!this._porofessorPath,
      porofessorEnabled: this.porofessorEnabled,
    })
  }

  setPorofessorPath(p: string) { this._porofessorPath = p }

  setPorofessorEnabled(enabled: boolean) {
    this.porofessorEnabled = enabled
    if (!enabled) {
      this.opts.porofessorLauncher.kill()
      this.log('Porofessor disabled')
    }
    this.broadcastIfChanged({
      leagueRunning: this.leagueWasRunning,
      blitzRunning: this.isBlitzRunning(),
      valorantRunning: this.valorantWasRunning,
      monitoringEnabled: this.monitoringEnabled,
      blitzPathSet: !!this._blitzPath,
      leagueEnabled: this.leagueEnabled,
      valorantEnabled: this.valorantEnabled,
      blitzEnabled: this.blitzEnabled,
      porofessorRunning: this.isPorofessorRunning(),
      porofessorPathSet: !!this._porofessorPath,
      porofessorEnabled: this.porofessorEnabled,
    })
  }

  setLeagueEnabled(enabled: boolean) { this.leagueEnabled = enabled }

  setValorantEnabled(enabled: boolean) { this.valorantEnabled = enabled }

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
      monitoringEnabled: enabled,
      blitzPathSet: !!this._blitzPath,
      leagueEnabled: this.leagueEnabled,
      valorantEnabled: this.valorantEnabled,
      blitzEnabled: this.blitzEnabled,
      porofessorRunning: this.isPorofessorRunning(),
      porofessorPathSet: !!this._porofessorPath,
      porofessorEnabled: this.porofessorEnabled,
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
