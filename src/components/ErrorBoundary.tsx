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
        <div className="col-span-2 flex flex-col items-center justify-center gap-4 p-12 bg-card border border-border rounded-2xl shadow-2xl">
          <h2 className="text-lg text-accent font-game">Something went wrong</h2>
          <p className="text-sm opacity-80 font-game">
            An unexpected error occurred. You can restart the game to continue playing.
          </p>
          <Button onClick={this.handleReset} className="font-game">
            Restart Game
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
