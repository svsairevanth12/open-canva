import { Component, ErrorInfo, ReactNode } from 'react';

type ErrorBoundaryProps = {
  children: ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
  message: string;
};

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    message: ''
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    /**
     * var: error
     * type: Error
     * desc: Runtime rendering error thrown by a child component.
     */
    return {
      hasError: true,
      message: error.message
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    /**
     * var: error
     * type: Error
     * desc: Runtime rendering error thrown by a child component.
     * var: info
     * type: ErrorInfo
     * desc: React error boundary metadata for diagnostics.
     */
    console.error(error, info.componentStack);
  }

  render(): ReactNode {
    /**
     * var: none
     * type: void
     * desc: Returns fallback UI for rendering errors or nested children content.
     */
    if (this.state.hasError) {
      return (
        <section className="error-boundary">
          <h2>Editor failed to render.</h2>
          <p>{this.state.message}</p>
        </section>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
