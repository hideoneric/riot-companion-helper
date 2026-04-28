import { execFile } from 'child_process'

export interface ProcessDetector {
  snapshot(): Promise<Set<string>>
}

export class TasklistProcessDetector implements ProcessDetector {
  snapshot(): Promise<Set<string>> {
    return new Promise((resolve, reject) => {
      execFile(
        'tasklist',
        ['/FO', 'CSV', '/NH'],
        {
          encoding: 'utf8',
          maxBuffer: 1024 * 1024,
          timeout: 2000,
          windowsHide: true
        },
        (error, stdout) => {
          if (error) {
            reject(error)
            return
          }

          resolve(parseTasklistCsv(stdout))
        }
      )
    })
  }
}

export function parseTasklistCsv(output: string): Set<string> {
  const processes = new Set<string>()

  for (const line of output.split(/\r?\n/)) {
    const fields = parseCsvLine(line)
    if (fields.length < 2) continue

    const imageName = fields[0].trim().toLowerCase()
    if (imageName.endsWith('.exe')) processes.add(imageName)
  }

  return processes
}

function parseCsvLine(line: string): string[] {
  const trimmed = line.trim()
  if (!trimmed) return []

  const fields: string[] = []
  let field = ''
  let quoted = false

  for (let index = 0; index < trimmed.length; index++) {
    const char = trimmed[index]
    const next = trimmed[index + 1]

    if (char === '"') {
      if (quoted && next === '"') {
        field += '"'
        index++
      } else {
        quoted = !quoted
      }
      continue
    }

    if (char === ',' && !quoted) {
      fields.push(field)
      field = ''
      continue
    }

    field += char
  }

  fields.push(field)

  return fields
}
