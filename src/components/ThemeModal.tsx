import React, { useState, useEffect } from 'react';
import { BigTheme, ClayColor } from '../types';
import { X, Plus, Trash2 } from 'lucide-react';

interface ThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (theme: BigTheme) => void;
  themeToEdit?: BigTheme | null;
}

const CLAY_COLORS: { id: ClayColor; label: string; hex: string }[] = [
  { id: 'ochre', label: 'Brand Ochre (Fulgor Solar)', hex: '#e8b94a' },
  { id: 'peach', label: 'Brand Peach (Amanecer)', hex: '#ffb084' },
  { id: 'coral', label: 'Brand Coral (Terracota)', hex: '#ff6b5a' },
  { id: 'lavender', label: 'Brand Lavender (Cielo Horizonte)', hex: '#b8a4ed' },
  { id: 'mint', label: 'Brand Mint (Salvia)', hex: '#a4d4c5' },
  { id: 'teal', label: 'Brand Teal (Pizarra)', hex: '#1a3a3a' },
  { id: 'pink', label: 'Brand Rose (Rosa Arcilla)', hex: '#ff637c' },
];

export const ThemeModal: React.FC<ThemeModalProps> = ({
  isOpen,
  onClose,
  onSave,
  themeToEdit,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState<ClayColor>('ochre');
  const [priority, setPriority] = useState<'alta' | 'media' | 'vital'>('alta');
  const [goals, setGoals] = useState<string[]>(['']);

  useEffect(() => {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

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

    onSave(themeData);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="theme-modal-title">
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 id="theme-modal-title" className="title-lg" style={{ fontFamily: 'var(--font-display)' }}>
            {themeToEdit ? 'Editar Wrapper' : 'Nuevo Wrapper (2027)'}
          </h3>
          <button
            onClick={onClose}
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
              placeholder="Ej: Salud Radical, Maestría en IA, Riqueza Soberana..."
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="theme-desc-input" className="caption-uppercase" style={{ display: 'block', marginBottom: 6 }}>
              Descripción / Propósito hacia 2027
            </label>
            <textarea
              id="theme-desc-input"
              className="textarea-custom"
              rows={3}
              placeholder="¿Por qué este pilar es fundamental para tu 2027?"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          <div>
            <label className="caption-uppercase" style={{ display: 'block', marginBottom: 6 }}>
              Color de Marca Clay
            </label>
            <div className="color-picker-palette">
              {CLAY_COLORS.map(c => (
                <button
                  key={c.id}
                  type="button"
                  className={`color-option-radio ${color === c.id ? 'selected' : ''}`}
                  style={{ backgroundColor: `var(--color-brand-${c.id})` }}
                  onClick={() => setColor(c.id)}
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
              Prioridad Estratégica
            </label>
            <select
              id="theme-priority-select"
              className="select-custom"
              value={priority}
              onChange={e => setPriority(e.target.value as any)}
            >
              <option value="vital">Vital (Máxima prioridad)</option>
              <option value="alta">Alta</option>
              <option value="media">Media</option>
            </select>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <label className="caption-uppercase">
                Metas Críticas 2027 bajo este Tema
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
                    placeholder={`Meta concreta #${idx + 1} para 2027`}
                    value={goal}
                    onChange={e => handleGoalChange(idx, e.target.value)}
                  />
                  <button
                    type="button"
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

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 12 }}>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary clay-button-interactive">
              {themeToEdit ? 'Guardar Cambios' : 'Crear Wrapper'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
