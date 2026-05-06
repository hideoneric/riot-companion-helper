import { useRef } from 'react'
import type { Settings, UpdateStatus } from '../App'
import { ControlInspector } from '../components/ControlInspector'

interface Props {
  settings: Settings
  updateStatus: UpdateStatus | null
  onSaveSettings: (s: Settings) => Promise<void>
  onCheckForUpdates: () => Promise<void>
  onInstallUpdate: () => void
}

export function SettingsPage({
  settings,
  updateStatus,
  onSaveSettings,
  onCheckForUpdates,
  onInstallUpdate
}: Props) {
  const settingsRef = useRef<HTMLElement>(null)

  return (
    <div className="page settings-page">
      <ControlInspector
        helpers={settings.helpers}
        settings={settings}
        updateStatus={updateStatus}
        inspectorRef={settingsRef}
        onSaveSettings={onSaveSettings}
        onCheckForUpdates={onCheckForUpdates}
        onInstallUpdate={onInstallUpdate}
      />
    </div>
  )
}
