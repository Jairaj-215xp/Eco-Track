import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from './Button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-danger-soft text-danger flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-ink mb-2">Something unexpected happened</h2>
          <p className="text-xs text-text-muted max-w-md mb-6">
            {this.state.error?.message || 'A visual component encountered an issue.'}
          </p>
          <div className="flex items-center space-x-3">
            <Button size="sm" onClick={this.handleReset} leftIcon={<RefreshCw className="w-4 h-4" />}>
              Reload Page
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { window.location.href = '/'; }} leftIcon={<Home className="w-4 h-4" />}>
              Return Home
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
