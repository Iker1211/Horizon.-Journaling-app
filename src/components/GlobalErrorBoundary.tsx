import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Horizon Crash Handler]:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.hash = '';
    window.location.reload();
  };

  public override render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100dvh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            backgroundColor: 'var(--color-canvas, #fffaf0)',
            color: 'var(--color-ink, #0a0a0a)',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              maxWidth: '420px',
              backgroundColor: 'var(--color-surface-card, #f5f0e0)',
              padding: '32px 24px',
              borderRadius: 'var(--radius-xl, 24px)',
              boxShadow: 'var(--shadow-card, 0 8px 30px rgba(0, 0, 0, 0.08))',
              border: '2px solid var(--color-hairline, #e5e5e5)',
            }}
          >
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>🐑🔥</div>
            <h2
              style={{
                fontFamily: 'var(--font-display, inherit)',
                fontSize: '22px',
                fontWeight: 700,
                marginBottom: '10px',
                color: 'var(--color-ink, #0a0a0a)',
              }}
            >
              Algo inesperado ocurrió
            </h2>
            <p
              style={{
                fontSize: '14px',
                lineHeight: 1.55,
                color: 'var(--color-muted, #6a6a6a)',
                marginBottom: '24px',
              }}
            >
              Horizon encontró un problema imprevisto. Tus datos locales guardados en el dispositivo permanecen intactos.
            </p>
            <button
              type="button"
              className="btn-primary"
              onClick={this.handleReset}
              style={{
                width: '100%',
                padding: '12px 20px',
                borderRadius: 'var(--radius-md, 12px)',
                cursor: 'pointer',
              }}
            >
              Reiniciar Aplicación
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
