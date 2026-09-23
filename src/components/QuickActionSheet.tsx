import React from 'react';
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
  if (!isOpen) return null;

  return (
    <div
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
              ✦ Creación Rápida
            </span>
            <h3 id="quick-action-title" className="quick-action-title">
              ¿Qué deseas registrar hacia 2027?
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'var(--color-surface-soft)',
              border: '1px solid var(--color-hairline)',
              borderRadius: 'var(--radius-pill)',
              width: 32,
              height: 32,
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
                <span>Nueva Reflexión en Bitácora</span>
                <ArrowRight size={14} color="var(--color-muted)" />
              </div>
              <div className="quick-action-text-desc">
                Documenta avances, modelos mentales y aprendizajes con Markdown enriquecido.
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
                <span>Nuevo Wrapper</span>
                <ArrowRight size={14} color="var(--color-muted)" />
              </div>
              <div className="quick-action-text-desc">
                Crea un nuevo pilar integral con paleta Clay para estructurar metas y bitácoras.
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
