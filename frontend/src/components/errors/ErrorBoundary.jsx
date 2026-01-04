/**
 * ErrorBoundary Component
 * 
 * Global error boundary để catch và display runtime errors
 * Prevents white screen of death trong production
 * 
 * @usage
 * <ErrorBoundary>
 *   <App />
 * </ErrorBoundary>
 */

import React from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';

// ============================================
// ERROR BOUNDARY CLASS COMPONENT
// ============================================

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    
    // Log error to console in development
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // TODO: Send to error tracking service (Sentry, etc.)
    // if (typeof window !== 'undefined' && window.Sentry) {
    //   window.Sentry.captureException(error, { extra: errorInfo });
    // }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    
    // Optionally refresh the page
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI from props
      if (this.props.fallback) {
        return this.props.fallback({
          error: this.state.error,
          errorInfo: this.state.errorInfo,
          reset: this.handleReset,
        });
      }

      // Default error UI
      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onReset={this.handleReset}
          onGoHome={this.handleGoHome}
          onReload={this.handleReload}
          showDetails={this.props.showDetails ?? process.env.NODE_ENV === 'development'}
        />
      );
    }

    return this.props.children;
  }
}

// ============================================
// ERROR FALLBACK COMPONENT
// ============================================

export function ErrorFallback({ 
  error, 
  errorInfo, 
  onReset, 
  onGoHome, 
  onReload,
  showDetails = false,
  title = 'Đã xảy ra lỗi',
  description = 'Xin lỗi, đã có lỗi không mong muốn xảy ra. Vui lòng thử lại hoặc liên hệ hỗ trợ.',
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-lg w-full">
        {/* Error Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 mb-4">
              <AlertTriangle className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white">{title}</h1>
            <p className="text-red-100 mt-2 text-sm">{description}</p>
          </div>

          {/* Actions */}
          <div className="px-6 py-6 space-y-3">
            <Button 
              onClick={onReload}
              className="w-full bg-indigo-600 hover:bg-indigo-700"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Tải lại trang
            </Button>
            
            <Button 
              onClick={onGoHome}
              variant="outline"
              className="w-full"
            >
              <Home className="mr-2 h-4 w-4" />
              Về trang chủ
            </Button>

            {onReset && (
              <Button 
                onClick={onReset}
                variant="ghost"
                className="w-full text-slate-500"
              >
                Thử lại
              </Button>
            )}
          </div>

          {/* Error Details (Development only) */}
          {showDetails && error && (
            <div className="px-6 pb-6">
              <details className="group">
                <summary className="flex items-center gap-2 text-sm text-slate-500 cursor-pointer hover:text-slate-700">
                  <Bug className="h-4 w-4" />
                  <span>Chi tiết lỗi (Dev only)</span>
                </summary>
                <div className="mt-3 p-4 bg-slate-900 rounded-lg overflow-auto max-h-64">
                  <pre className="text-xs text-red-400 whitespace-pre-wrap font-mono">
                    {error.toString()}
                    {errorInfo?.componentStack && (
                      <>
                        {'\n\nComponent Stack:'}
                        {errorInfo.componentStack}
                      </>
                    )}
                  </pre>
                </div>
              </details>
            </div>
          )}
        </div>

        {/* Help text */}
        <p className="text-center text-sm text-slate-500 mt-4">
          Nếu lỗi tiếp tục xảy ra, vui lòng liên hệ{' '}
          <a 
            href="mailto:support@skillmaster.vn" 
            className="text-indigo-600 hover:underline"
          >
            support@skillmaster.vn
          </a>
        </p>
      </div>
    </div>
  );
}

// ============================================
// FEATURE ERROR BOUNDARY
// ============================================

/**
 * Smaller error boundary cho feature-level errors
 * Shows inline error instead of full page
 */
export function FeatureErrorBoundary({ children, featureName = 'tính năng' }) {
  return (
    <ErrorBoundary
      fallback={({ error, reset }) => (
        <FeatureErrorFallback 
          error={error} 
          onRetry={reset}
          featureName={featureName}
        />
      )}
    >
      {children}
    </ErrorBoundary>
  );
}

export function FeatureErrorFallback({ error, onRetry, featureName }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
        <AlertTriangle className="h-6 w-6 text-red-600" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-1">
        Không thể tải {featureName}
      </h3>
      <p className="text-sm text-slate-500 mb-4 max-w-sm">
        Đã xảy ra lỗi khi tải {featureName}. Vui lòng thử lại.
      </p>
      <Button onClick={onRetry} size="sm">
        <RefreshCw className="mr-2 h-4 w-4" />
        Thử lại
      </Button>
      
      {process.env.NODE_ENV === 'development' && error && (
        <pre className="mt-4 p-3 bg-slate-100 rounded text-xs text-red-600 max-w-full overflow-auto">
          {error.toString()}
        </pre>
      )}
    </div>
  );
}

// ============================================
// HOOK FOR ERROR HANDLING
// ============================================

/**
 * Custom hook để handle async errors
 * Integrates với ErrorBoundary
 */
export function useErrorHandler() {
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  const handleError = React.useCallback((err) => {
    setError(err);
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  return { handleError, clearError };
}

export default ErrorBoundary;
