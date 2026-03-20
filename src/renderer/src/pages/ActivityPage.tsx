import React, { useEffect, useRef } from 'react'
import type { LogEntry } from '../App'

interface Props {
  entries: LogEntry[]
}

const levelColor: Record<LogEntry['level'], string> = {
  info: '#8e8e9a',
  warn: '#f0a500',
  error: '#e53935',
}

export function ActivityPage({ entries }: Props) {
  const topRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    topRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [entries.length])

  return (
    <div style={{ padding: '32px 36px', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <h2
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: '#ffffff',
          margin: '0 0 16px',
          paddingBottom: 8,
          borderBottom: '1px solid #2c2c32',
          flexShrink: 0,
        }}
      >
        Activity Log
      </h2>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          background: '#28282d',
          borderRadius: 8,
          border: '1px solid #2c2c32',
          padding: '12px 16px',
          minHeight: 0,
        }}
      >
        {entries.length === 0 ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: '#3a3a3e',
              fontSize: 13,
            }}
          >
            No activity yet
          </div>
        ) : (
          <>
            <div ref={topRef} />
            {entries.map((e, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  gap: 12,
                  fontSize: 12,
                  marginBottom: 6,
                  lineHeight: 1.6,
                }}
              >
                <span style={{ color: '#3a3a3e', minWidth: 60, flexShrink: 0, fontFamily: 'monospace' }}>
                  {e.timestamp}
                </span>
                <span style={{ color: levelColor[e.level] }}>{e.message}</span>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
