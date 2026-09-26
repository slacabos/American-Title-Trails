import React from "react";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error("Game error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-dvh grid place-items-center p-4">
          <div className="flex flex-col items-center gap-4 p-10 max-w-md text-center bg-card text-card-foreground border border-border rounded-2xl shadow-2xl">
            <h2 className="m-0 text-lg font-semibold text-forest">Something went wrong</h2>
            <p className="m-0 text-sm text-muted-foreground">
              An unexpected error occurred. You can restart the game to continue playing.
            </p>
            <Button onClick={this.handleReset}>Restart Game</Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
