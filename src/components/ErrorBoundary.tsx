import React, { ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('ErrorBoundary caught:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-destructive/10 p-4">
                    <div className="max-w-md">
                        <h1 className="text-2xl font-bold text-destructive mb-4">
                            Something went wrong
                        </h1>
                        <p className="text-foreground/80 mb-4">
                            An error occurred while rendering this page.
                        </p>
                        {this.state.error && (
                            <pre className="bg-muted p-4 rounded text-xs overflow-auto mb-4">
                                {this.state.error.message}
                            </pre>
                        )}
                        <button
                            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
                            onClick={() => (window.location.href = '/')}
                        >
                            Go back home
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
