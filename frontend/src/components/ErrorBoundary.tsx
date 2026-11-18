import { Component, type ErrorInfo, type ReactNode } from 'react';

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((props: { error: Error | null; reset: () => void }) => ReactNode);
  onReset?: () => void;
  title?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  reset = (): void => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (typeof this.props.fallback === 'function') {
        return this.props.fallback({ error: this.state.error, reset: this.reset });
      }

      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          role="alert"
          style={{
            padding: '24px',
            borderRadius: '8px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#991b1b',
            margin: '16px 0',
            textAlign: 'left',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ fontSize: '18px' }}>⚠️</span>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#991b1b' }}>
              {this.props.title || 'Something went wrong'}
            </h3>
          </div>
          <p style={{ margin: '0 0 16px', fontSize: '14px', color: '#7f1d1d', lineHeight: 1.5 }}>
            {this.state.error?.message || 'An unexpected rendering error occurred.'}
          </p>
          <button
            type="button"
            onClick={this.reset}
            style={{
              padding: '6px 14px',
              fontSize: '13px',
              fontWeight: 600,
              borderRadius: '6px',
              border: '1px solid #dc2626',
              backgroundColor: '#dc2626',
              color: '#ffffff',
              cursor: 'pointer',
              lineHeight: '20px',
            }}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
