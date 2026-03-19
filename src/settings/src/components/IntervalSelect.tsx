import React from 'react'

interface Props {
  value: number
  onChange: (v: number) => void
}

export function IntervalSelect({ value, onChange }: Props) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 12, color: '#a0a0b8' }}>Polling Interval</span>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          background: '#13121f',
          border: '1px solid #2d2b45',
          borderRadius: 6,
          padding: '5px 10px',
          color: '#fff',
          fontSize: 12,
          cursor: 'pointer',
          outline: 'none',
        }}
      >
        {[1, 2, 3, 5, 10].map((s) => (
          <option key={s} value={s}>
            {s}s
          </option>
        ))}
      </select>
    </div>
  )
}
