import React from 'react';
import { useDialog } from '../hooks/useDialog';
import { X, BookOpen, Layers, ArrowRight } from 'lucide-react';

interface QuickActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onWriteEntry: () => void;
  onAddTheme: () => void;
}

export const QuickActionSheet: React.FC<QuickActionSheetProps> = ({
  isOpen,
  onClose,
  onWriteEntry,
  onAddTheme,
}) => {
  const dialogRef = useDialog(isOpen, onClose);
  if (!isOpen) return null;

  return (
    <div
      ref={dialogRef}
      tabIndex={-1}
      className="quick-action-sheet-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-action-title"
    >
      <div className="quick-action-sheet-card" onClick={e => e.stopPropagation()}>
        <div className="quick-action-header">
          <div>
            <span className="caption-uppercase" style={{ color: 'var(--color-brand-coral)', fontWeight: 800 }}>
              UN PASO MÁS
            </span>
            <h3 id="quick-action-title" className="quick-action-title">
              ¿Qué quieres crear?
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'var(--color-surface-soft)',
              border: '1px solid var(--color-hairline)',
              borderRadius: 'var(--radius-pill)',
              width: 44,
              height: 44,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--color-ink)',
            }}
            aria-label="Cerrar ventana de creación rápida"
          >
            <X size={16} />
          </button>
        </div>

        <div className="quick-action-options">
          {/* 1. Redactar Bitácora */}
          <button
            type="button"
            className="quick-action-btn"
            onClick={() => {
              onClose();
              onWriteEntry();
            }}
          >
            <div className="quick-action-icon-box" style={{ background: 'var(--color-brand-coral)' }}>
              <BookOpen size={20} />
            </div>
            <div style={{ flex: 1 }}>
              <div className="quick-action-text-title">
                <span>Entrada de bitácora</span>
                <ArrowRight size={14} color="var(--color-muted)" />
              </div>
              <div className="quick-action-text-desc">
                Anota una idea, un aprendizaje o un avance.
              </div>
            </div>
          </button>

          {/* 2. Crear Wrapper */}
          <button
            type="button"
            className="quick-action-btn"
            onClick={() => {
              onClose();
              onAddTheme();
            }}
          >
            <div className="quick-action-icon-box" style={{ background: 'var(--color-brand-ochre)' }}>
              <Layers size={20} />
            </div>
            <div style={{ flex: 1 }}>
              <div className="quick-action-text-title">
                <span>Wrapper</span>
                <ArrowRight size={14} color="var(--color-muted)" />
              </div>
              <div className="quick-action-text-desc">
                Organiza un proyecto con sus metas y notas.
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
