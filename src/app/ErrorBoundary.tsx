import React from 'react';
import { AlertTriangle, Home, RotateCcw } from 'lucide-react';
import { Card, Button } from '../design/components';

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error instanceof Error ? error.message : 'Lỗi không xác định',
    };
  }

  private handleReset = () => {
    this.setState({ hasError: false, errorMessage: '' });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center p-6">
          <Card padding="lg" className="max-w-md w-full text-center space-y-4">
            <div
              className="w-12 h-12 mx-auto rounded-full flex items-center justify-center"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--color-wrong) 15%, var(--color-surface-2))',
                color: 'var(--color-wrong)',
              }}
            >
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
              Đã xảy ra lỗi hiển thị màn hình
            </h2>
            <p
              className="text-xs px-3 py-2 rounded border"
              style={{
                fontFamily: 'var(--font-mono)',
                backgroundColor: 'var(--color-surface-2)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-dim)',
              }}
            >
              ERR_UI_BOUNDARY: {this.state.errorMessage}
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <Button
                variant="primary"
                leftIcon={<RotateCcw className="w-4 h-4" />}
                onClick={this.handleReset}
                data-testid="error-retry"
              >
                Thử lại
              </Button>
              <a
                href="#/"
                className="inline-flex items-center justify-center min-h-[44px] px-4 py-2.5 gap-2 text-sm font-medium rounded-[var(--radius-md)] border"
                style={{
                  backgroundColor: 'var(--color-surface-2)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text)',
                }}
                data-testid="error-go-today"
              >
                <Home className="w-4 h-4" />
                Về Hôm nay
              </a>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
