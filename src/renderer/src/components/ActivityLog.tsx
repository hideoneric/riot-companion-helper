import React, { useEffect, useRef } from 'react'

interface LogEntry {
  timestamp: string
  message: string
  level: 'info' | 'warn' | 'error'
}

interface Props {
  entries: LogEntry[]
}

const levelColor: Record<LogEntry['level'], string> = {
  info: '#a0a0b8',
  warn: '#f0a500',
  error: '#e53935',
}

export function ActivityLog({ entries }: Props) {
  const topRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    topRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [entries.length])

  return (
    <div style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.1em',
          color: '#555',
          marginBottom: 10,
          textTransform: 'uppercase',
        }}
      >
        Activity Log
      </div>
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          background: '#13121f',
          borderRadius: 8,
          padding: '10px 12px',
          border: '1px solid #2d2b45',
        }}
      >
        {entries.length === 0 && (
          <div style={{ color: '#444', fontSize: 12, textAlign: 'center', marginTop: 24 }}>
            No activity yet
          </div>
        )}
        <div ref={topRef} />
        {entries.map((e, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              gap: 10,
              fontSize: 12,
              marginBottom: 5,
              lineHeight: 1.5,
            }}
          >
            <span style={{ color: '#444', minWidth: 58, flexShrink: 0 }}>{e.timestamp}</span>
            <span style={{ color: levelColor[e.level] }}>{e.message}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
