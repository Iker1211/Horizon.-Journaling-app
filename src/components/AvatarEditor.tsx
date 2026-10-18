import React, { useEffect, useMemo, useState } from 'react';
import { LoaderCircle, X } from 'lucide-react';
import { processAvatar } from '../utils/avatar';

interface AvatarEditorProps {
  file: File;
  onCancel: () => void;
  onSave: (avatar: Blob) => Promise<void>;
}

export const AvatarEditor: React.FC<AvatarEditorProps> = ({ file, onCancel, onSave }) => {
  const previewUrl = useMemo(() => URL.createObjectURL(file), [file]);
  const [zoom, setZoom] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => () => URL.revokeObjectURL(previewUrl), [previewUrl]);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const avatar = await processAvatar(file, { zoom, offsetX, offsetY });
      await onSave(avatar);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No pudimos procesar la imagen.');
      setSaving(false);
    }
  };

  return (
    <div className="profile-dialog-backdrop" role="presentation">
      <section className="profile-dialog" role="dialog" aria-modal="true" aria-labelledby="avatar-editor-title">
        <header><div><span className="profile-eyebrow">FOTO DE PERFIL</span><h2 id="avatar-editor-title">Ajusta tu foto</h2></div><button type="button" className="profile-icon-button" onClick={onCancel} disabled={saving} aria-label="Cerrar"><X size={21} /></button></header>
        <div className="avatar-crop-preview" aria-label="Vista previa del recorte">
          <img src={previewUrl} alt="" style={{ transform: `translate(${offsetX * -18}%, ${offsetY * -18}%) scale(${zoom})` }} />
        </div>
        <label className="profile-range"><span>Acercar</span><input type="range" min="1" max="3" step="0.05" value={zoom} onChange={event => setZoom(Number(event.target.value))} /></label>
        <label className="profile-range"><span>Mover horizontalmente</span><input type="range" min="-1" max="1" step="0.05" value={offsetX} onChange={event => setOffsetX(Number(event.target.value))} /></label>
        <label className="profile-range"><span>Mover verticalmente</span><input type="range" min="-1" max="1" step="0.05" value={offsetY} onChange={event => setOffsetY(Number(event.target.value))} /></label>
        {error && <p className="profile-feedback profile-feedback--error" role="alert">{error}</p>}
        <div className="profile-dialog-actions"><button type="button" className="btn-secondary" onClick={onCancel} disabled={saving}>Cancelar</button><button type="button" className="btn-primary" onClick={() => void save()} disabled={saving}>{saving ? <><LoaderCircle className="profile-spinner" size={17} />Guardando…</> : 'Usar esta foto'}</button></div>
      </section>
    </div>
  );
};
