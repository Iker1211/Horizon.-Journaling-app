import React, { useState, useEffect } from 'react';
import { BigTheme, ClayColor } from '../types';
import { useDialog } from '../hooks/useDialog';
import { X, Plus, Trash2 } from 'lucide-react';

interface ThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (theme: BigTheme) => Promise<void>;
  themeToEdit?: BigTheme | null;
}

const CLAY_COLORS: { id: ClayColor; label: string; hex: string }[] = [
  { id: 'ochre', label: 'Ocre', hex: '#e8b94a' },
  { id: 'peach', label: 'Durazno', hex: '#ffb084' },
  { id: 'coral', label: 'Coral', hex: '#ff6b5a' },
  { id: 'lavender', label: 'Lavanda', hex: '#b8a4ed' },
  { id: 'mint', label: 'Menta', hex: '#a4d4c5' },
  { id: 'teal', label: 'Verde', hex: '#1a3a3a' },
  { id: 'pink', label: 'Rosa', hex: '#ff637c' },
];

export const ThemeModal: React.FC<ThemeModalProps> = ({
  isOpen,
  onClose,
  onSave,
  themeToEdit,
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const dialogRef = useDialog(isOpen, () => { if (!isSaving) onClose(); });
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState<ClayColor>('ochre');
  const [priority, setPriority] = useState<'alta' | 'media' | 'vital'>('alta');
  const [goals, setGoals] = useState<string[]>(['']);

  useEffect(() => {
    setSaveError(null);
    if (themeToEdit) {
      setName(themeToEdit.name);
      setDescription(themeToEdit.description);
      setColor(themeToEdit.color);
      setPriority(themeToEdit.priority);
      setGoals(themeToEdit.targetGoals2027.length > 0 ? [...themeToEdit.targetGoals2027] : ['']);
    } else {
      setName('');
      setDescription('');
      setColor('ochre');
      setPriority('alta');
      setGoals(['']);
    }
  }, [themeToEdit, isOpen]);

  if (!isOpen) return null;

  const handleAddGoal = () => {
    setGoals([...goals, '']);
  };

  const handleGoalChange = (index: number, value: string) => {
    const updated = [...goals];
    updated[index] = value;
    setGoals(updated);
  };

  const handleRemoveGoal = (index: number) => {
    if (goals.length <= 1) {
      setGoals(['']);
      return;
    }
    setGoals(goals.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isSaving) return;

    const filteredGoals = goals.map(g => g.trim()).filter(Boolean);

    const themeData: BigTheme = {
      id: themeToEdit ? themeToEdit.id : `theme-${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      color,
      icon: 'Target',
      targetGoals2027: filteredGoals,
      priority,
      createdAt: themeToEdit ? themeToEdit.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setIsSaving(true);
    setSaveError(null);
    try {
      await onSave(themeData);
      onClose();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'No se pudo guardar. Inténtalo de nuevo.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div ref={dialogRef} tabIndex={-1} className="modal-overlay" onClick={() => { if (!isSaving) onClose(); }} role="dialog" aria-modal="true" aria-labelledby="theme-modal-title">
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 id="theme-modal-title" className="title-lg" style={{ fontFamily: 'var(--font-display)' }}>
            {themeToEdit ? 'Editar Wrapper' : 'Nuevo wrapper'}
          </h3>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="icon-button"
            aria-label="Cerrar modal de wrapper"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)' }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label htmlFor="theme-name-input" className="caption-uppercase" style={{ display: 'block', marginBottom: 6 }}>
              Nombre del Wrapper
            </label>
            <input
              id="theme-name-input"
              type="text"
              required
              className="input-text"
              placeholder="Ej. Aprender un idioma"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="theme-desc-input" className="caption-uppercase" style={{ display: 'block', marginBottom: 6 }}>
              ¿Qué quieres lograr? · opcional
            </label>
            <textarea
              id="theme-desc-input"
              className="textarea-custom"
              rows={3}
              placeholder="Describe brevemente el propósito de este espacio."
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          <details className="wrapper-optional-details" open={Boolean(themeToEdit)}>
          <summary>Personalizar wrapper <span>Color, prioridad y metas · opcional</span></summary>
          <div className="wrapper-optional-fields">
          <div>
            <label className="caption-uppercase" style={{ display: 'block', marginBottom: 6 }}>
              Color
            </label>
            <div className="color-picker-palette">
              {CLAY_COLORS.map(c => (
                <button
                  key={c.id}
                  type="button"
                  className={`color-option-radio ${color === c.id ? 'selected' : ''}`}
                  style={{ backgroundColor: `var(--color-brand-${c.id})` }}
                  onClick={() => setColor(c.id)}
                  aria-label={c.label}
                  aria-pressed={color === c.id}
                  title={c.label}
                >
                  {color === c.id && (
                    <span
                      style={{
                        color: c.id === 'ochre' || c.id === 'peach' || c.id === 'mint' || c.id === 'lavender' ? 'var(--color-ink)' : 'var(--color-on-primary)',
                        fontSize: 13,
                        fontWeight: 800,
                      }}
                    >
                      ✓
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="theme-priority-select" className="caption-uppercase" style={{ display: 'block', marginBottom: 6 }}>
              Prioridad
            </label>
            <select
              id="theme-priority-select"
              className="select-custom"
              value={priority}
              onChange={e => setPriority(e.target.value as BigTheme['priority'])}
            >
              <option value="vital">Vital (Máxima prioridad)</option>
              <option value="alta">Alta</option>
              <option value="media">Media</option>
            </select>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <label className="caption-uppercase">
                Metas para 2027
              </label>
              <button
                type="button"
                className="btn-secondary btn-sm"
                onClick={handleAddGoal}
                style={{ padding: '4px 10px', height: 28 }}
              >
                <Plus size={13} /> Añadir Meta
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {goals.map((goal, idx) => (
                <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    type="text"
                    className="input-text"
                    aria-label={`Meta ${idx + 1}`}
                    placeholder={`Meta concreta #${idx + 1} para 2027`}
                    value={goal}
                    onChange={e => handleGoalChange(idx, e.target.value)}
                  />
                  <button
                    type="button"
                    aria-label={`Eliminar meta ${idx + 1}`}
                    className="icon-button"
                    onClick={() => handleRemoveGoal(idx)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-muted)',
                      cursor: 'pointer',
                      padding: 4,
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          </div>
          </details>
          {saveError && <p className="form-error" role="alert">{saveError}</p>}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 12 }}>
            <button type="button" className="btn-secondary" onClick={onClose} disabled={isSaving}>
              Cancelar
            </button>
            <button type="submit" disabled={isSaving} className="btn-primary clay-button-interactive">
              {isSaving ? 'Guardando…' : themeToEdit ? 'Guardar cambios' : 'Crear wrapper'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
