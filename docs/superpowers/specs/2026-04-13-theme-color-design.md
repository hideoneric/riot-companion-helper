# Theme Color Customization — Design Spec

**Date:** 2026-04-13

## Summary

Allow users to change the app's accent color via a palette + custom color picker in Settings. The current hardcoded purple (`#7c5cbf`) becomes a user-configurable value, persisted in electron-store and applied via a CSS custom property.

---

## Scope

- **In scope:** Accent color only — sidebar active indicator, buttons, badges, toggles, glows, and any other `#7c5cbf` usages in the renderer.
- **Out of scope:** Background colors, text colors, dark/light mode switching.

---

## Architecture

### 1. Data Layer (`src/main/settings-store.ts`)

Add `themeColor: string` to the settings schema with default `#7c5cbf`. No new IPC channels are needed — the existing `settings:get` / `settings:save` flow serializes the full settings object.

### 2. CSS Variable Injection (`src/renderer/src/App.tsx`)

The root `<div>` in `App.tsx` receives:

```tsx
style={{ '--accent': settings.themeColor } as React.CSSProperties}
```

The `Settings` interface gains `themeColor: string`. The default value in the `useState` initializer stays `#7c5cbf` so the accent color is correct from first render before the store responds.

Every hardcoded `#7c5cbf` in the renderer is replaced with `var(--accent)`. Files affected:
- `src/renderer/src/App.tsx`
- `src/renderer/src/components/Sidebar.tsx`
- `src/renderer/src/pages/HomePage.tsx`
- `src/renderer/src/pages/SettingsPage.tsx`

### 3. Color Picker UI (`src/renderer/src/pages/SettingsPage.tsx`)

A new **Appearance** section is added to the General settings sub-page, below the existing General fields.

**Preset swatches:** 8 fixed colors:

| Name    | Hex       |
|---------|-----------|
| Purple  | `#7c5cbf` |
| Blue    | `#3b82f6` |
| Teal    | `#06b6d4` |
| Green   | `#10b981` |
| Red     | `#ef4444` |
| Orange  | `#f59e0b` |
| Pink    | `#ec4899` |
| Yellow  | `#84cc16` |

**Custom swatch:** A rainbow conic-gradient circle. Clicking it programmatically clicks a hidden `<input type="color">` (native OS color picker, no extra dependencies). The `onChange` handler calls `onSave({ ...settings, themeColor: e.target.value })`.

**Active indicator:** The swatch matching `settings.themeColor` (exact hex match) gets a `2px solid white` ring. The custom swatch gets the ring when no preset matches.

**Interaction:** Selecting any swatch or confirming a custom color calls `onSave` immediately — the CSS variable updates live with no save button needed.

---

## Files to Modify

| File | Change |
|---|---|
| `src/main/settings-store.ts` | Add `themeColor` field with default `#7c5cbf` |
| `src/renderer/src/App.tsx` | Add `themeColor` to `Settings` interface + default state; inject `--accent` CSS var on root div |
| `src/renderer/src/components/Sidebar.tsx` | Replace `#7c5cbf` → `var(--accent)` |
| `src/renderer/src/pages/HomePage.tsx` | Replace `#7c5cbf` → `var(--accent)` |
| `src/renderer/src/pages/SettingsPage.tsx` | Replace `#7c5cbf` → `var(--accent)`; add Appearance section with palette + custom picker |

---

## Error Handling

- If `themeColor` is missing from the store (old install upgrading), `electron-store`'s default (`#7c5cbf`) covers it — no migration needed.
- If a malformed hex somehow ends up in the store, the CSS variable silently falls back to the browser default (transparent) — acceptable since this is user-controlled input from a controlled picker.

---

## Testing

- `npm run typecheck` — verify no type errors after adding `themeColor` to `Settings`
- Manual: change accent in Settings, verify sidebar indicator, homepage badge, and toggle switch all update live
- Manual: restart app, verify chosen color persists
