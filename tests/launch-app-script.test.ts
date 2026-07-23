import { readFileSync } from 'fs'
import { resolve } from 'path'
import { describe, expect, test } from 'vitest'

describe('Windows app launcher', () => {
  test('passes the project directory as the Electron app path', () => {
    const launcher = readFileSync(resolve(__dirname, '../scripts/launch-app.cmd'), 'utf8')

    expect(launcher).toContain('node_modules\\electron\\dist\\electron.exe')
    expect(launcher).toContain('"%APP_DIR%"')
  })
})
