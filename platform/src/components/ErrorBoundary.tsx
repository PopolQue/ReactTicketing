import React from 'react';
import { Link } from 'react-router-dom';

interface Props {
  children?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '40px', textAlign: 'center' }}>
          <div className="glass-panel" style={{ padding: '40px', maxWidth: '600px', border: '1px solid #ef4444' }}>
            <h1 style={{ color: '#ef4444', marginBottom: '16px', fontSize: '3rem' }}>⚠️</h1>
            <h2 style={{ marginBottom: '16px' }}>Something went wrong.</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
              We've encountered an unexpected error. Our team has been notified.
            </p>
            <div style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '8px', overflowX: 'auto', marginBottom: '24px', textAlign: 'left', fontFamily: 'monospace', fontSize: '0.85rem', color: '#fca5a5' }}>
              {this.state.error?.message}
            </div>
            <button 
              onClick={() => window.location.href = '/'} 
              className="btn-primary"
            >
              Return to Home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
