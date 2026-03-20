import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: string | null }
> {
  state = { error: null }
  static getDerivedStateFromError(e: Error) {
    return { error: e.message }
  }
  render() {
    if (this.state.error)
      return (
        <div style={{ color: '#cf6679', padding: 20, fontFamily: 'monospace', fontSize: 11 }}>
          Error: {this.state.error}
        </div>
      )
    return this.props.children
  }
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
)
