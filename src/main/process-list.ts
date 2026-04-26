import { execSync } from 'child_process'

export interface ProcessOption {
  name: string
}

export function parseTasklistCsv(output: string): ProcessOption[] {
  const names = new Set<string>()

  for (const line of output.split(/\r?\n/)) {
    const match = line.match(/^"([^"]+)"/)
    if (match?.[1]) names.add(match[1])
  }

  return [...names]
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
    .map((name) => ({ name }))
}

export function listRunningProcesses(): ProcessOption[] {
  try {
    const output = execSync('tasklist /FO CSV /NH', { encoding: 'utf8' })
    return parseTasklistCsv(String(output))
  } catch {
    return []
  }
}
