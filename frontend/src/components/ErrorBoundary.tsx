import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button } from './ui/Button'
import { IconAlertTriangle } from './ui/icons'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled error in Emberline UI:', error, info)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-graphite-950 px-6 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-temp-hot/15 text-temp-hot">
          <IconAlertTriangle className="h-6 w-6" />
        </span>
        <div>
          <p className="font-display text-lg font-medium text-fog-50">Something broke on our end</p>
          <p className="mt-1 max-w-sm text-sm text-slate-400">
            The interface hit an unexpected error. Reloading usually fixes it.
          </p>
        </div>
        <Button onClick={() => window.location.reload()}>Reload</Button>
      </div>
    )
  }
}
