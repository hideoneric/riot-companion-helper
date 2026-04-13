# Theme Color Customization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users pick an accent color (preset palette + custom picker) that replaces the hardcoded `#7c5cbf` throughout the app, persisted in electron-store.

**Architecture:** `themeColor: string` is added to the settings store and `Settings` interface. `App.tsx` injects `--accent` as a CSS custom property on the root div. All `#7c5cbf` occurrences in the renderer are replaced with `var(--accent)`. A new Appearance section in General settings shows 8 preset swatches plus a custom swatch backed by a hidden `<input type="color">`.

**Tech Stack:** React inline styles, CSS custom properties, native `<input type="color">`, electron-store v8.

---

### Task 1: Add themeColor to the settings store and Settings interface

**Files:**
- Modify: `src/main/settings-store.ts`
- Modify: `src/renderer/src/App.tsx`

- [ ] **Step 1: Add `themeColor` to the `AppSettings` interface and defaults in `src/main/settings-store.ts`**

  Replace the existing `AppSettings` interface and `DEFAULTS` object and both functions with:

  ```ts
  import Store from 'electron-store'

  export interface AppSettings {
    blitzPath: string
    launchWithWindows: boolean
    pollingInterval: number // seconds, 1–10
    monitoringEnabled: boolean
    leagueEnabled: boolean
    valorantEnabled: boolean
    porofessorPath: string
    porofessorEnabled: boolean
    blitzVisible: boolean
    porofessorVisible: boolean
    themeColor: string
  }

  const DEFAULTS: AppSettings = {
    blitzPath: '',
    launchWithWindows: false,
    pollingInterval: 3,
    monitoringEnabled: true,
    leagueEnabled: true,
    valorantEnabled: true,
    porofessorPath: '',
    porofessorEnabled: true,
    blitzVisible: true,
    porofessorVisible: true,
    themeColor: '#7c5cbf',
  }

  const store = new Store<AppSettings>({ defaults: DEFAULTS })

  export function getSettings(): AppSettings {
    return {
      blitzPath: store.get('blitzPath', DEFAULTS.blitzPath),
      launchWithWindows: store.get('launchWithWindows', DEFAULTS.launchWithWindows),
      pollingInterval: store.get('pollingInterval', DEFAULTS.pollingInterval),
      monitoringEnabled: store.get('monitoringEnabled', DEFAULTS.monitoringEnabled),
      leagueEnabled: store.get('leagueEnabled', DEFAULTS.leagueEnabled),
      valorantEnabled: store.get('valorantEnabled', DEFAULTS.valorantEnabled),
      porofessorPath: store.get('porofessorPath', DEFAULTS.porofessorPath),
      porofessorEnabled: store.get('porofessorEnabled', DEFAULTS.porofessorEnabled),
      blitzVisible: store.get('blitzVisible', DEFAULTS.blitzVisible),
      porofessorVisible: store.get('porofessorVisible', DEFAULTS.porofessorVisible),
      themeColor: store.get('themeColor', DEFAULTS.themeColor),
    }
  }

  export function saveSettings(s: AppSettings): void {
    store.set('blitzPath', s.blitzPath)
    store.set('launchWithWindows', s.launchWithWindows)
    store.set('pollingInterval', s.pollingInterval)
    store.set('monitoringEnabled', s.monitoringEnabled)
    store.set('leagueEnabled', s.leagueEnabled)
    store.set('valorantEnabled', s.valorantEnabled)
    store.set('porofessorPath', s.porofessorPath)
    store.set('porofessorEnabled', s.porofessorEnabled)
    store.set('blitzVisible', s.blitzVisible)
    store.set('porofessorVisible', s.porofessorVisible)
    store.set('themeColor', s.themeColor)
  }
  ```

- [ ] **Step 2: Add `themeColor` to the `Settings` interface and default state in `src/renderer/src/App.tsx`**

  Add `themeColor: string` to the `Settings` interface (after `porofessorVisible`):

  ```ts
  export interface Settings {
    blitzPath: string
    launchWithWindows: boolean
    pollingInterval: number
    monitoringEnabled: boolean
    leagueEnabled: boolean
    valorantEnabled: boolean
    porofessorPath: string
    porofessorEnabled: boolean
    blitzVisible: boolean
    porofessorVisible: boolean
    themeColor: string
  }
  ```

  Add `themeColor: '#7c5cbf'` to the `useState` default (the object passed to `useState<Settings>()`):

  ```ts
  const [settings, setSettings] = useState<Settings>({
    blitzPath: '',
    launchWithWindows: false,
    pollingInterval: 3,
    monitoringEnabled: true,
    leagueEnabled: true,
    valorantEnabled: true,
    porofessorPath: '',
    porofessorEnabled: true,
    blitzVisible: true,
    porofessorVisible: true,
    themeColor: '#7c5cbf',
  })
  ```

- [ ] **Step 3: Inject the `--accent` CSS variable on the root div in `src/renderer/src/App.tsx`**

  Find the root `<div>` at the top of the `App` return (the one with `height: '100vh'`). Add `'--accent': settings.themeColor` to its style:

  ```tsx
  <div style={{
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    background: '#111114',
    '--accent': settings.themeColor,
  } as React.CSSProperties}>
  ```

- [ ] **Step 4: Run typecheck to confirm no errors**

  ```bash
  npm run typecheck
  ```

  Expected: no errors.

- [ ] **Step 5: Commit**

  ```bash
  git add src/main/settings-store.ts src/renderer/src/App.tsx
  git commit -m "feat: add themeColor to settings store and inject --accent CSS variable"
  ```

---

### Task 2: Replace all hardcoded #7c5cbf accent color references

**Files:**
- Modify: `src/renderer/src/components/Sidebar.tsx`
- Modify: `src/renderer/src/pages/HomePage.tsx`
- Modify: `src/renderer/src/pages/SettingsPage.tsx`

- [ ] **Step 1: Replace accent color in `src/renderer/src/components/Sidebar.tsx`**

  In the `NavItem` component, find the `borderLeft` style:
  ```ts
  borderLeft: `3px solid ${active ? '#7c5cbf' : 'transparent'}`,
  ```
  Replace with:
  ```ts
  borderLeft: `3px solid ${active ? 'var(--accent)' : 'transparent'}`,
  ```

- [ ] **Step 2: Replace accent colors in `src/renderer/src/pages/HomePage.tsx`**

  There are four locations:

  **a)** The `statusColor` variable (line ~32):
  ```ts
  const statusColor = !anyPathSet ? '#f0a500' : !monitoringEnabled ? '#555560' : '#7c5cbf'
  ```
  Replace with:
  ```ts
  const statusColor = !anyPathSet ? '#f0a500' : !monitoringEnabled ? '#555560' : 'var(--accent)'
  ```

  **b)** The status dot `boxShadow` (line ~45):
  ```ts
  boxShadow: monitoringEnabled && anyPathSet ? '0 0 8px #7c5cbf88' : 'none',
  ```
  Replace with:
  ```ts
  boxShadow: monitoringEnabled && anyPathSet ? '0 0 8px color-mix(in srgb, var(--accent) 53%, transparent)' : 'none',
  ```

  **c)** The `ToggleSwitch` background (line ~163):
  ```ts
  cursor: 'pointer', background: on ? '#7c5cbf' : '#3a3a3e',
  ```
  Replace with:
  ```ts
  cursor: 'pointer', background: on ? 'var(--accent)' : '#3a3a3e',
  ```

  **d)** The `SettingsLink` hover border (line ~278):
  ```ts
  border: `1px solid ${hovered ? '#7c5cbf' : '#2c2c32'}`,
  ```
  Replace with:
  ```ts
  border: `1px solid ${hovered ? 'var(--accent)' : '#2c2c32'}`,
  ```

- [ ] **Step 3: Replace accent colors in `src/renderer/src/pages/SettingsPage.tsx`**

  There are five locations:

  **a)** `BehaviorSettings` save button background (line ~243):
  ```ts
  background: '#7c5cbf',
  ```
  Replace with:
  ```ts
  background: 'var(--accent)',
  ```

  **b)** `VisibilityToggleRow` toggle background (line ~315):
  ```ts
  cursor: 'pointer', background: on ? '#7c5cbf' : '#3a3a3e',
  ```
  Replace with:
  ```ts
  cursor: 'pointer', background: on ? 'var(--accent)' : '#3a3a3e',
  ```

  **c)** `OutlinedButton` hover background (line ~346):
  ```ts
  background: hovered && !disabled ? 'rgba(124,92,191,0.12)' : 'transparent',
  ```
  Replace with:
  ```ts
  background: hovered && !disabled ? 'color-mix(in srgb, var(--accent) 12%, transparent)' : 'transparent',
  ```

  **d)** `OutlinedButton` border and color (lines ~347–349):
  ```ts
  border: `1px solid ${disabled ? '#3a3a3e' : '#7c5cbf'}`,
  ...
  color: disabled ? '#555560' : '#7c5cbf',
  ```
  Replace with:
  ```ts
  border: `1px solid ${disabled ? '#3a3a3e' : 'var(--accent)'}`,
  ...
  color: disabled ? '#555560' : 'var(--accent)',
  ```

  **e)** `CheckboxRow` border and background (lines ~388–390):
  ```ts
  border: `1.5px solid ${checked ? '#7c5cbf' : '#3a3a3e'}`,
  background: checked ? '#7c5cbf' : 'transparent',
  ```
  Replace with:
  ```ts
  border: `1.5px solid ${checked ? 'var(--accent)' : '#3a3a3e'}`,
  background: checked ? 'var(--accent)' : 'transparent',
  ```

- [ ] **Step 4: Replace accent color in the `UpdateBanner` in `src/renderer/src/App.tsx`**

  In the `UpdateBanner` component's install button style (line ~222):
  ```ts
  background: '#7c5cbf', border: 'none', borderRadius: 4,
  ```
  Replace with:
  ```ts
  background: 'var(--accent)', border: 'none', borderRadius: 4,
  ```

- [ ] **Step 5: Run typecheck**

  ```bash
  npm run typecheck
  ```

  Expected: no errors.

- [ ] **Step 6: Commit**

  ```bash
  git add src/renderer/src/components/Sidebar.tsx src/renderer/src/pages/HomePage.tsx src/renderer/src/pages/SettingsPage.tsx src/renderer/src/App.tsx
  git commit -m "feat: replace hardcoded accent color with CSS var(--accent)"
  ```

---

### Task 3: Add Appearance section with color picker to GeneralSettings

**Files:**
- Modify: `src/renderer/src/pages/SettingsPage.tsx`

- [ ] **Step 1: Add `AppearanceSection` component to `src/renderer/src/pages/SettingsPage.tsx`**

  Add this new component anywhere after the `OutlinedButton` component definition (before or after `CheckboxRow` — order doesn't matter):

  ```tsx
  const ACCENT_PRESETS = [
    '#7c5cbf', '#3b82f6', '#06b6d4', '#10b981',
    '#ef4444', '#f59e0b', '#ec4899', '#84cc16',
  ]

  function AppearanceSection({
    settings,
    onSave,
  }: {
    settings: Settings
    onSave: (s: Settings) => Promise<void>
  }) {
    const colorInputRef = React.useRef<HTMLInputElement>(null)
    const isCustom = !ACCENT_PRESETS.includes(settings.themeColor)

    return (
      <div style={{ marginTop: 20 }}>
        <SectionHeading>Appearance</SectionHeading>
        <SettingRow label="Accent color">
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {ACCENT_PRESETS.map((color) => {
              const active = settings.themeColor === color
              return (
                <button
                  key={color}
                  onClick={() => onSave({ ...settings, themeColor: color })}
                  title={color}
                  style={{
                    width: 24, height: 24, borderRadius: '50%', border: 'none',
                    background: color, cursor: 'pointer', padding: 0, flexShrink: 0,
                    outline: active ? '2px solid #ffffff' : '2px solid transparent',
                    outlineOffset: 2,
                  }}
                />
              )
            })}
            {/* Custom swatch */}
            <button
              onClick={() => colorInputRef.current?.click()}
              title="Custom color"
              style={{
                width: 24, height: 24, borderRadius: '50%', border: 'none',
                background: 'conic-gradient(red, yellow, lime, cyan, blue, magenta, red)',
                cursor: 'pointer', padding: 0, flexShrink: 0,
                outline: isCustom ? '2px solid #ffffff' : '2px solid transparent',
                outlineOffset: 2,
              }}
            />
            <input
              ref={colorInputRef}
              type="color"
              value={settings.themeColor}
              onChange={(e) => onSave({ ...settings, themeColor: e.target.value })}
              style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 0, height: 0 }}
            />
          </div>
        </SettingRow>
      </div>
    )
  }
  ```

- [ ] **Step 2: Render `AppearanceSection` at the bottom of `GeneralSettings`**

  In `GeneralSettings`, find the closing `</div>` of the return (after the polling interval `<SettingRow>`). Add `<AppearanceSection>` just before it:

  ```tsx
      {/* ── Appearance ── */}
      <div style={{ height: 1, background: '#2c2c32', margin: '20px 0' }} />
      <AppearanceSection settings={settings} onSave={onSave} />
    </div>
  )
  ```

  The full bottom of `GeneralSettings`'s return should look like:

  ```tsx
      {/* ── Polling interval ── */}
      <SectionHeading>App</SectionHeading>

      <SettingRow label="Polling interval">
        <select
          value={interval}
          onChange={(e) => handleUpdateInterval(Number(e.target.value))}
          style={{
            background: '#28282d', border: '1px solid #3a3a3e', borderRadius: 6,
            padding: '6px 10px', color: '#ffffff', fontSize: 12, cursor: 'pointer', outline: 'none',
          }}
        >
          {[1, 2, 3, 5, 10].map((s) => (
            <option key={s} value={s}>{s}s</option>
          ))}
        </select>
      </SettingRow>

      {/* ── Appearance ── */}
      <div style={{ height: 1, background: '#2c2c32', margin: '20px 0' }} />
      <AppearanceSection settings={settings} onSave={onSave} />
    </div>
  )
  ```

- [ ] **Step 3: Run typecheck**

  ```bash
  npm run typecheck
  ```

  Expected: no errors.

- [ ] **Step 4: Run the app and manually verify**

  ```bash
  npm run dev
  ```

  Check:
  - Settings → General → scroll to bottom → Appearance section shows 8 colored circles + rainbow circle
  - Clicking a preset swatch instantly changes the sidebar active indicator, toggle switches, buttons
  - Clicking the rainbow circle opens the OS color picker; picking a color applies it live
  - Rainbow circle gets the white ring when a custom color is active; a preset gets the ring when matched
  - Restart the app (`Ctrl+C`, `npm run dev`) — the chosen color persists

- [ ] **Step 5: Commit**

  ```bash
  git add src/renderer/src/pages/SettingsPage.tsx
  git commit -m "feat: add Appearance section with accent color picker to General settings"
  ```

---

### Task 4: Build and release

- [ ] **Step 1: Run full build**

  ```bash
  npm run build:win
  ```

  Expected: completes without errors, produces installer in `dist/`.

- [ ] **Step 2: Bump version in `package.json`**

  Change `"version"` from `"1.8.0"` to `"1.9.0"`.

- [ ] **Step 3: Commit version bump**

  ```bash
  git add package.json
  git commit -m "chore: bump version to 1.9.0"
  ```

- [ ] **Step 4: Push to GitHub**

  ```bash
  git push origin master
  ```

- [ ] **Step 5: Package and create GitHub release**

  ```bash
  npm run package
  ```

  Then create the release:

  ```bash
  "/c/Program Files/GitHub CLI/gh.exe" release create v1.9.0 "dist/riot-companion-helper-1.9.0-setup.exe" --title "v1.9.0 - Theme color customization" --notes "## What's new

  - **Accent color picker** — choose your app theme color in Settings → General → Appearance
  - 8 preset colors (purple, blue, teal, green, red, orange, pink, lime) plus a custom color picker
  - Color persists across restarts"
  ```
