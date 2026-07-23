import * as path from 'path'
import { BlitzLauncher } from './launcher'
import { PowerShellProcessDetector } from './process-detector'
import type { ProcessDetector } from './process-detector'

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
  processDetector?: ProcessDetector
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
  private blitzLeagueBinding = true
  private blitzValorantBinding = true
  private anyEnabledWasRunning = false
  private consecutiveErrors = 0
  private intervalHandle: ReturnType<typeof setInterval> | null = null
  private _blitzPath = ''
  private _porofessorPath = ''
  private blitzProcessName = 'Blitz.exe'
  private porofessorProcessName = ''
  private porofessorEnabled = true
  private porofessorLeagueBinding = true
  private porofessorValorantBinding = false
  private porofessorWasRunningForBinding = false
  private lastState: PollerState | null = null
  private lastProcesses = new Set<string>()
  private isTickRunning = false
  private processDetector: ProcessDetector

  private broadcastIfChanged(state: PollerState) {
    const s = this.lastState
    if (
      s &&
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
    )
      return
    this.lastState = state
    this.opts.onStateChange(state)
  }

  constructor(private opts: PollerOptions) {
    this.processDetector = opts.processDetector ?? new PowerShellProcessDetector()
  }

  private log(message: string, level: LogEntry['level'] = 'info') {
    this.opts.onLog({
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
      message,
      level
    })
  }

  private hasProcess(processes: Set<string>, imageName: string): boolean {
    return processes.has(imageName.toLowerCase())
  }

  private isBlitzRunning(processes = this.lastProcesses): boolean {
    return this.hasProcess(processes, this.blitzProcessName) || this.opts.launcher.launchedPid != null
  }

  private isPorofessorRunning(processes = this.lastProcesses): boolean {
    if (!this._porofessorPath) return false
    const exeName = this.porofessorProcessName || path.basename(this._porofessorPath)
    if (!exeName.toLowerCase().endsWith('.exe')) {
      return this.opts.porofessorLauncher.launchedPid != null
    }
    return this.hasProcess(processes, exeName) || this.opts.porofessorLauncher.launchedPid != null
  }

  private buildState(processes = this.lastProcesses): PollerState {
    return {
      leagueRunning: this.leagueWasRunning,
      blitzRunning: this.isBlitzRunning(processes),
      valorantRunning: this.valorantWasRunning,
      monitoringEnabled: this.monitoringEnabled,
      blitzPathSet: !!this._blitzPath,
      leagueEnabled: this.leagueEnabled,
      valorantEnabled: this.valorantEnabled,
      blitzEnabled: this.blitzEnabled,
      porofessorRunning: this.isPorofessorRunning(processes),
      porofessorPathSet: !!this._porofessorPath,
      porofessorEnabled: this.porofessorEnabled
    }
  }

  async tick(): Promise<void> {
    if (!this.monitoringEnabled) return
    if (this.isTickRunning) return

    this.isTickRunning = true
    try {
      await this.runTick()
    } finally {
      this.isTickRunning = false
    }
  }

  private async runTick(): Promise<void> {
    let leagueRunning: boolean
    let valorantRunning: boolean
    let processes: Set<string>
    try {
      processes = await this.processDetector.snapshot()
      this.lastProcesses = processes
      leagueRunning = this.hasProcess(processes, 'LeagueClient.exe')
      valorantRunning = this.hasProcess(processes, 'VALORANT.exe')
      this.consecutiveErrors = 0
    } catch (error) {
      this.consecutiveErrors++
      if (this.consecutiveErrors === 3) {
        const reason = error instanceof Error ? error.message : String(error)
        this.log(`Process detection error: ${reason}`, 'error')
        this.opts.onTrayNotify?.(
          'Riot Companion Helper',
          'Process detection failed — see activity log'
        )
      }
      return
    }

    // Log game transitions
    if (leagueRunning && !this.leagueWasRunning) this.log('League of Legends detected')
    else if (!leagueRunning && this.leagueWasRunning) this.log('League of Legends closed')
    if (valorantRunning && !this.valorantWasRunning) this.log('Valorant detected')
    else if (!valorantRunning && this.valorantWasRunning) this.log('Valorant closed')

    // Primary helper: launch when any enabled, bound game starts.
    const anyEnabledRunning =
      (leagueRunning && this.leagueEnabled && this.blitzLeagueBinding) ||
      (valorantRunning && this.valorantEnabled && this.blitzValorantBinding)

    if (anyEnabledRunning && !this.anyEnabledWasRunning) {
      if (this.isBlitzRunning(processes)) {
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
    }

    const stateProcesses = new Set(processes)

    if (!anyEnabledRunning && this.anyEnabledWasRunning) {
      await Promise.all([this.opts.launcher.kill(), BlitzLauncher.killByName()])
      stateProcesses.delete(this.blitzProcessName.toLowerCase())
      this.log('Blitz.gg closed')
    }

    // Secondary helper: launch when any enabled, bound game starts.
    const porofessorBoundGameRunning =
      (leagueRunning && this.leagueEnabled && this.porofessorLeagueBinding) ||
      (valorantRunning && this.valorantEnabled && this.porofessorValorantBinding)
    if (porofessorBoundGameRunning && !this.porofessorWasRunningForBinding) {
      if (this.isPorofessorRunning(processes)) {
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
    } else if (!porofessorBoundGameRunning && this.porofessorWasRunningForBinding) {
      await this.opts.porofessorLauncher.kill()
      const porofessorExeName = (
        this.porofessorProcessName || path.basename(this._porofessorPath)
      ).toLowerCase()
      stateProcesses.delete(porofessorExeName)
      this.log('Porofessor closed')
    }

    this.leagueWasRunning = leagueRunning
    this.valorantWasRunning = valorantRunning
    this.anyEnabledWasRunning = anyEnabledRunning
    this.porofessorWasRunningForBinding = porofessorBoundGameRunning

    this.broadcastIfChanged(this.buildState(stateProcesses))
  }

  setBlitzPath(p: string) {
    this._blitzPath = p
  }

  setBlitzProcessName(name: string) {
    this.blitzProcessName = name.trim() || 'Blitz.exe'
  }

  setBlitzGameBindings(bindings: { league: boolean; valorant: boolean }) {
    this.blitzLeagueBinding = bindings.league
    this.blitzValorantBinding = bindings.valorant
  }

  setBlitzEnabled(enabled: boolean) {
    this.blitzEnabled = enabled
    if (!enabled) {
      this.forgetProcess(this.blitzProcessName)
      void this.opts.launcher.kill()
      void BlitzLauncher.killByName()
      this.log('Blitz.gg disabled')
    }
    this.broadcastIfChanged(this.buildState())
  }

  setPorofessorPath(p: string) {
    this._porofessorPath = p
  }

  setPorofessorProcessName(name: string) {
    this.porofessorProcessName = name.trim()
  }

  setPorofessorGameBindings(bindings: { league: boolean; valorant: boolean }) {
    this.porofessorLeagueBinding = bindings.league
    this.porofessorValorantBinding = bindings.valorant
  }

  setPorofessorEnabled(enabled: boolean) {
    this.porofessorEnabled = enabled
    if (!enabled) {
      this.forgetPorofessorProcess()
      void this.opts.porofessorLauncher.kill()
      this.log('Porofessor disabled')
    }
    this.broadcastIfChanged(this.buildState())
  }

  setLeagueEnabled(enabled: boolean) {
    this.leagueEnabled = enabled
  }

  setValorantEnabled(enabled: boolean) {
    this.valorantEnabled = enabled
  }

  setMonitoring(enabled: boolean) {
    this.monitoringEnabled = enabled
    if (!enabled) {
      this.log('Monitoring paused')
      this.stopInterval()
    } else {
      this.log('Monitoring resumed')
    }
    this.broadcastIfChanged(this.buildState())
  }

  startInterval(seconds: number) {
    this.stopInterval()
    this.intervalHandle = setInterval(() => {
      void this.tick()
    }, seconds * 1000)
    void this.tick()
  }

  stopInterval() {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle)
      this.intervalHandle = null
    }
  }

  private forgetProcess(imageName: string): void {
    this.lastProcesses = new Set(this.lastProcesses)
    this.lastProcesses.delete(imageName.toLowerCase())
  }

  private forgetPorofessorProcess(): void {
    if (!this._porofessorPath) return
    this.forgetProcess(this.porofessorProcessName || path.basename(this._porofessorPath))
  }
}
