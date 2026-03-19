import React from 'react'

interface Props {
  value: string
  onChange: (v: string) => void
  onBrowse: () => void
  valid: boolean
}

export function PathField({ value, onChange, onBrowse, valid }: Props) {
  return (
    <div>
      <label style={{ fontSize: 12, color: '#a0a0b8', display: 'block', marginBottom: 6 }}>
        Blitz Path
      </label>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="C:\...\Blitz.exe"
          style={{
            flex: 1,
            background: '#13121f',
            border: `1px solid ${valid ? '#2d2b45' : '#e53935'}`,
            borderRadius: 6,
            padding: '7px 10px',
            color: '#fff',
            fontSize: 12,
            outline: 'none',
            transition: 'border-color 0.2s',
          }}
        />
        <button
          onClick={onBrowse}
          style={{
            background: '#7c5cbf',
            border: 'none',
            borderRadius: 6,
            padding: '7px 14px',
            color: '#fff',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 600,
            whiteSpace: 'nowrap',
          }}
        >
          Browse
        </button>
      </div>
      {!valid && value && (
        <div style={{ color: '#e53935', fontSize: 11, marginTop: 5 }}>
          File not found or invalid path
        </div>
      )}
    </div>
  )
}
