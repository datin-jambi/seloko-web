import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, RotateCcw, Home } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in React component tree:', error, errorInfo)
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null })
    window.location.reload()
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen w-full items-center justify-center bg-background p-4">
          <Card className="max-w-md w-full border-destructive/30 shadow-xl">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <CardTitle className="text-lg text-foreground">
                Terjadi Kesalahan Aplikasi
              </CardTitle>
              <CardDescription className="text-xs">
                Sistem mendeteksi kendala pada antarmuka. Anda dapat mencoba memuat ulang halaman ini.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
              {this.state.error?.message && (
                <div className="rounded-lg bg-muted/50 p-2.5 font-mono text-[11px] text-muted-foreground break-all">
                  {this.state.error.message}
                </div>
              )}
              <div className="flex gap-2">
                <Button
                  onClick={this.handleReset}
                  variant="default"
                  className="flex-1 text-xs"
                >
                  <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                  Muat Ulang Halaman
                </Button>
                <Button
                  onClick={() => (window.location.href = '/dashboard')}
                  variant="outline"
                  className="text-xs"
                >
                  <Home className="mr-1.5 h-3.5 w-3.5" />
                  Dasbor
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}
