export function getCompanionDisplayName(
  filePath: string,
  manualName: string,
  fallbackName = 'Companion'
): string {
  const trimmedManual = manualName.trim()
  if (trimmedManual) return trimmedManual

  const fileName = filePath.trim().split(/[\\/]/).filter(Boolean).pop() ?? ''
  const derivedName = fileName.replace(/\.(exe|lnk)$/i, '').trim()
  return derivedName || fallbackName
}

export function getCompanionInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || 'C'
}
