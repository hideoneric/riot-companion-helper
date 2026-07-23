import type { HelperConfig, Settings } from '../App'

export function syncLegacyFields(settings: Settings): Settings {
  const [primaryHelper, secondaryHelper] = settings.helpers

  return {
    ...settings,
    blitzPath: primaryHelper?.path ?? '',
    blitzName: primaryHelper?.displayName ?? '',
    blitzEnabled: primaryHelper?.enabled ?? false,
    blitzVisible: primaryHelper?.showOnOverview ?? true,
    porofessorPath: secondaryHelper?.path ?? '',
    porofessorName: secondaryHelper?.displayName ?? '',
    porofessorEnabled: secondaryHelper?.enabled ?? false,
    porofessorVisible: secondaryHelper?.showOnOverview ?? true
  }
}

export function bindingLabel(helper: HelperConfig): string {
  if (helper.gameBindings.league && helper.gameBindings.valorant) return 'League + Valorant'
  if (helper.gameBindings.league) return 'League'
  if (helper.gameBindings.valorant) return 'Valorant'
  return 'No games'
}
