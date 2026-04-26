import { execSync } from 'child_process'
import * as path from 'path'
import { BlitzLauncher } from './launcher'
import type { HelperSlotSettings } from './settings-store'

export interface LogEntry {
  timestamp: string
  message: string
  level: 'info' | 'warn' | 'error'
}

export interface HelperSlotState {
  running: boolean
  processRunning: boolean
  pathSet: boolean
  processSet: boolean
  enabled: boolean
  visible: boolean
}

export interface PollerState {
  leagueRunning: boolean
  valorantRunning: boolean
  monitoringEnabled: boolean
  leagueHelper: HelperSlotState
  valorantHelper: HelperSlotState
}

interface PollerOptions {
  leagueLauncher: BlitzLauncher
  valorantLauncher: BlitzLauncher
  onLog: (entry: LogEntry) => void
  onStateChange: (state: PollerState) => void
  onTrayNotify?: (title: string, message: string) => void
}

type HelperKey = 'league' | 'valorant'

interface HelperRuntime {
  label: string
  settings: HelperSlotSettings
  launcher: BlitzLauncher
  processWasRunning: boolean
}

const EMPTY_HELPER: HelperSlotSettings = {
  appPath: '',
  processName: '',
  enabled: true,
  visible: true
}

export class Poller {
  private monitoringEnabled = true
  private consecutiveErrors = 0
  private intervalHandle: ReturnType<typeof setInterval> | null = null
  private lastState: PollerState | null = null
  private helpers: Record<HelperKey, HelperRuntime>

  constructor(private opts: PollerOptions) {
    this.helpers = {
      league: {
        label: 'League helper',
        settings: { ...EMPTY_HELPER },
        launcher: opts.leagueLauncher,
        processWasRunning: false
      },
      valorant: {
        label: 'Valorant helper',
        settings: { ...EMPTY_HELPER },
        launcher: opts.valorantLauncher,
        processWasRunning: false
      }
    }
  }

  private broadcastIfChanged(state: PollerState): void {
    const s = this.lastState
    if (s && JSON.stringify(s) === JSON.stringify(state)) return
    this.lastState = state
    this.opts.onStateChange(state)
  }

  private log(message: string, level: LogEntry['level'] = 'info'): void {
    this.opts.onLog({
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
      message,
      level
    })
  }

  private isProcessRunning(processName: string): boolean {
    if (!processName) return false
    const output = execSync(`tasklist /FI "IMAGENAME eq ${processName}" /NH`, {
      encoding: 'utf8'
    })
    return String(output).toLowerCase().includes(processName.toLowerCase())
  }

  private isHelperRunning(helper: HelperRuntime): boolean {
    if (!helper.settings.appPath) return false
    const exeName = path.basename(helper.settings.appPath)
    if (!exeName.toLowerCase().endsWith('.exe')) return helper.launcher.launchedPid !== null

    try {
      return this.isProcessRunning(exeName)
    } catch {
      return helper.launcher.launchedPid !== null
    }
  }

  private stateForHelper(helper: HelperRuntime, processRunning: boolean): HelperSlotState {
    return {
      running: this.isHelperRunning(helper),
      processRunning,
      pathSet: !!helper.settings.appPath,
      processSet: !!helper.settings.processName,
      enabled: helper.settings.enabled,
      visible: helper.settings.visible
    }
  }

  private processHelper(helper: HelperRuntime, processRunning: boolean): void {
    const ready =
      helper.settings.enabled && !!helper.settings.appPath && !!helper.settings.processName

    if (processRunning && !helper.processWasRunning && ready) {
      if (helper.launcher.launchedPid) {
        this.log(`${helper.label} already running - skipping launch`)
      } else {
        this.log(`Launching ${helper.label}`)
        try {
          helper.launcher.launch(helper.settings.appPath)
          this.log(`${helper.label} launched`)
        } catch (e) {
          this.log(`Failed to launch ${helper.label}: ${(e as Error).message}`, 'error')
        }
      }
    } else if (!processRunning && helper.processWasRunning) {
      helper.launcher.kill()
      this.log(`${helper.label} closed`)
    }

    helper.processWasRunning = processRunning
  }

  tick(): void {
    if (!this.monitoringEnabled) return

    let leagueRunning: boolean
    let valorantRunning: boolean
    try {
      leagueRunning = this.isProcessRunning(this.helpers.league.settings.processName)
      valorantRunning = this.isProcessRunning(this.helpers.valorant.settings.processName)
      this.consecutiveErrors = 0
    } catch {
      this.consecutiveErrors++
      if (this.consecutiveErrors === 3) {
        this.log('Process detection error - check app permissions', 'error')
        this.opts.onTrayNotify?.(
          'Riot Companion Helper',
          'Process detection error - check app permissions'
        )
      }
      return
    }

    this.processHelper(this.helpers.league, leagueRunning)
    this.processHelper(this.helpers.valorant, valorantRunning)

    this.broadcastIfChanged({
      leagueRunning,
      valorantRunning,
      monitoringEnabled: this.monitoringEnabled,
      leagueHelper: this.stateForHelper(this.helpers.league, leagueRunning),
      valorantHelper: this.stateForHelper(this.helpers.valorant, valorantRunning)
    })
  }

  setLeagueHelper(settings: HelperSlotSettings): void {
    this.setHelper('league', settings)
  }

  setValorantHelper(settings: HelperSlotSettings): void {
    this.setHelper('valorant', settings)
  }

  private setHelper(key: HelperKey, settings: HelperSlotSettings): void {
    const helper = this.helpers[key]
    helper.settings = settings
    if (!settings.enabled) {
      helper.launcher.kill()
      this.log(`${helper.label} disabled`)
    }
    this.broadcastCurrentState()
  }

  setMonitoring(enabled: boolean): void {
    this.monitoringEnabled = enabled
    if (!enabled) {
      this.log('Monitoring paused')
      this.stopInterval()
    } else {
      this.log('Monitoring resumed')
      this.tick()
    }
    this.broadcastCurrentState()
  }

  private broadcastCurrentState(): void {
    this.broadcastIfChanged({
      leagueRunning: this.helpers.league.processWasRunning,
      valorantRunning: this.helpers.valorant.processWasRunning,
      monitoringEnabled: this.monitoringEnabled,
      leagueHelper: this.stateForHelper(this.helpers.league, this.helpers.league.processWasRunning),
      valorantHelper: this.stateForHelper(
        this.helpers.valorant,
        this.helpers.valorant.processWasRunning
      )
    })
  }

  startInterval(seconds: number): void {
    this.stopInterval()
    this.intervalHandle = setInterval(() => this.tick(), seconds * 1000)
    this.tick()
  }

  stopInterval(): void {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle)
      this.intervalHandle = null
    }
  }
}
