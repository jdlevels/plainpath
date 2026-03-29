import React from "react"
import { AlertTriangle } from "lucide-react"

interface Props {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface State {
  error: Error | null
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary] Caught render error:", error.message, info.componentStack)
  }

  handleReset = () => {
    this.setState({ error: null })
  }

  render() {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
          <div className="max-w-sm w-full text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/40 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground mb-1">Something went wrong</h2>
              <p className="text-sm text-muted-foreground">
                The page encountered an error. Please go back and try again.
              </p>
              <p className="text-[11px] text-muted-foreground/60 mt-2 font-mono break-all">
                {this.state.error.message}
              </p>
            </div>
            <button
              onClick={() => { this.handleReset(); window.history.back() }}
              className="text-sm font-semibold text-primary hover:underline"
            >
              ← Go back
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
