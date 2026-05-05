import { Component, type ReactNode } from "react";

interface EditorErrorBoundaryProps {
  fallback: ReactNode;
  children: ReactNode;
}

interface EditorErrorBoundaryState {
  failed: boolean;
}

export class EditorErrorBoundary extends Component<EditorErrorBoundaryProps, EditorErrorBoundaryState> {
  state: EditorErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): EditorErrorBoundaryState {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}
