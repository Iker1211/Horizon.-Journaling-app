import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Bold, Italic, Heading2, Quote, List, ListOrdered, CheckSquare, Code, Link, Eye, Edit3, Columns, Check, AlertCircle, Cloud, CloudOff, HelpCircle, Laptop } from 'lucide-react';
import type { BlogEntry, BigTheme } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { useEntryDraft } from '../hooks/useEntryDraft';
import { useCompanionPresence } from '../hooks/useCompanionPresence';

interface BlogEditorPageProps {
  userId: string;
  themes: BigTheme[];
  initialThemeId?: string | null;
  entryToEdit?: BlogEntry | null;
  onSave: (entry: BlogEntry) => Promise<void>;
  onSaved?: (entry: BlogEntry) => void;
  onBack: () => void;
}

const formats = [
  { label: 'Negrita', icon: Bold, prefix: '**', suffix: '**', placeholder: 'texto' },
  { label: 'Cursiva', icon: Italic, prefix: '*', suffix: '*', placeholder: 'texto' },
  { label: 'Encabezado', icon: Heading2, prefix: '## ', suffix: '', placeholder: 'Sección', block: true },
  { label: 'Cita', icon: Quote, prefix: '> ', suffix: '', placeholder: 'Una idea para recordar', block: true },
  { label: 'Lista con viñetas', icon: List, prefix: '- ', suffix: '', placeholder: 'Un paso', block: true },
  { label: 'Lista numerada', icon: ListOrdered, prefix: '1. ', suffix: '', placeholder: 'Un paso', block: true },
  { label: 'Lista de tareas', icon: CheckSquare, prefix: '- [ ] ', suffix: '', placeholder: 'Una tarea', block: true },
  { label: 'Código en línea', icon: Code, prefix: '`', suffix: '`', placeholder: 'código' },
  { label: 'Insertar enlace', icon: Link, prefix: '[', suffix: '](https://)', placeholder: 'texto del enlace' },
];

export const BlogEditorPage: React.FC<BlogEditorPageProps> = ({ userId, themes, initialThemeId, entryToEdit, onSave, onSaved, onBack }) => {
  const draft = useEntryDraft(userId, themes, entryToEdit, initialThemeId);
  const { enabled: presenceEnabled, actions: presenceActions } = useCompanionPresence();
  const { values, update } = draft;
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invalidTitle, setInvalidTitle] = useState(false);
  const [mode, setMode] = useState<'write' | 'split' | 'preview'>('write');
  const [help, setHelp] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);
  const titleRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const theme = themes.find(t => t.id === values.themeId);
  const wordCount = values.content.trim() ? values.content.trim().split(/\s+/).length : 0;
  const statusText = isSaving ? 'Guardando en tu cuenta…' : draft.status === 'error' ? 'Borrador sin proteger' : draft.status === 'pending' ? 'Guardando borrador…' : draft.status === 'local' ? 'Borrador en este dispositivo' : entryToEdit ? 'Sin cambios pendientes' : 'Todavía no has escrito';
  const StatusIcon = draft.status === 'error' ? AlertCircle : draft.status === 'local' ? (presenceEnabled ? Laptop : Check) : Cloud;
  const draftFailed = draft.status === 'error';
  useEffect(() => { presenceActions.editorState(isSaving, Boolean(error) || draftFailed); }, [presenceActions, isSaving, error, draftFailed]);
  useEffect(() => () => presenceActions.resetEditor(), [presenceActions]);

  useEffect(() => {
    const changed = () => setOnline(navigator.onLine);
    window.addEventListener('online', changed);
    window.addEventListener('offline', changed);
    return () => { window.removeEventListener('online', changed); window.removeEventListener('offline', changed); };
  }, []);

  useEffect(() => {
    const field = textareaRef.current;
    if (!field || mode === 'split') return;
    field.style.height = '0px';
    field.style.height = `${Math.max(300, field.scrollHeight)}px`;
  }, [values.content, mode]);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 860px)');
    const compact = () => { if (media.matches) setMode(m => m === 'split' ? 'write' : m); };
    compact(); media.addEventListener('change', compact);
    return () => media.removeEventListener('change', compact);
  }, []);

  const format = (prefix: string, suffix = '', placeholder = '', block = false) => {
    const field = textareaRef.current;
    if (!field || isSaving) return;
    const start = field.selectionStart;
    const end = field.selectionEnd;
    const selected = values.content.slice(start, end) || placeholder;
    const before = values.content.slice(0, start);
    const lead = block && before && !before.endsWith('\n') ? '\n' : '';
    update('content', `${before}${lead}${prefix}${selected}${suffix}${values.content.slice(end)}`);
    requestAnimationFrame(() => { field.focus(); field.setSelectionRange(start + lead.length + prefix.length, start + lead.length + prefix.length + selected.length); });
  };

  const save = async () => {
    if (draft.isSaving()) return;
    if (!values.title.trim()) { setInvalidTitle(true); setError('Ponle un título para poder encontrarla después.'); titleRef.current?.focus(); return; }
    if (!theme) { setError('Elige el wrapper donde quieres guardar esta entrada.'); return; }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(values.date) || !Number.isFinite(Date.parse(values.date))) { setError('Revisa la fecha en «Detalles de la entrada».'); return; }
    draft.flush();
    if (!online) { setError('Sin conexión. Puedes seguir escribiendo; vuelve a guardar cuando recuperes la conexión.'); return; }
    const stamp = new Date().toISOString();
    const identity = draft.getIdentity();
    const entry: BlogEntry = { id: identity.id, createdAt: identity.createdAt, updatedAt: stamp,
      title: values.title.trim(), content: values.content, themeId: values.themeId, date: values.date,
      summary: values.summary.trim(), tags: values.tagsInput.split(',').map(t => t.trim()).filter(Boolean),
      readTimeMinutes: Math.max(1, Math.ceil(wordCount / 180)),
    };
    draft.beginSave();
    presenceActions.editorState(true, false);
    setIsSaving(true); setError(null); setInvalidTitle(false);
    try {
      await onSave(entry);
      draft.markCommitted();
      draft.finishSave();
      if (onSaved) onSaved(entry); else onBack();
    } catch {
      setError('No pudimos confirmar el guardado en tu cuenta. Tu texto sigue aquí. Comprueba la conexión o tu sesión y vuelve a guardar.');
    } finally { draft.finishSave(); setIsSaving(false); }
  };

  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') { event.preventDefault(); void save(); }
    };
    window.addEventListener('keydown', shortcut);
    return () => window.removeEventListener('keydown', shortcut);
  });

  const canvas = <div className="editor-canvas-card">
    <label className="sr-only" htmlFor="entry-title">Título de la entrada</label>
    <input id="entry-title" ref={titleRef} value={values.title} onChange={e => { update('title', e.target.value); setInvalidTitle(false); }} placeholder="Título de tu entrada" className="editor-title-input" disabled={isSaving} aria-invalid={invalidTitle} aria-describedby={invalidTitle ? 'entry-save-error' : undefined} />
    <label className="sr-only" htmlFor="entry-content">Contenido Markdown</label>
    <textarea id="entry-content" ref={textareaRef} value={values.content} onChange={e => update('content', e.target.value)} disabled={isSaving}
      onKeyDown={e => { if ((e.ctrlKey || e.metaKey) && ['b', 'i'].includes(e.key.toLowerCase())) { e.preventDefault(); format(e.key.toLowerCase() === 'b' ? '**' : '*', e.key.toLowerCase() === 'b' ? '**' : '*', 'texto'); } }}
      placeholder={'¿Qué te gustaría recordar de hoy?\n\nPuedes escribir tal como te salga.'} className="editor-markdown-textarea" spellCheck />
  </div>;
  const preview = <article className="reader-article-sheet" aria-label="Vista previa de la entrada"><h1 className="reader-hero-title">{values.title || 'Tu entrada'}</h1>{values.summary && <p className="reader-lead-summary">{values.summary}</p>}<MarkdownRenderer content={values.content} themeColor={theme?.color} /></article>;

  return <section className={`single-column-sheet editor-page editor-page--${mode} journey-editor${presenceEnabled ? ' presence-editor' : ''}`} aria-label={entryToEdit ? 'Editar entrada' : 'Nueva entrada'} aria-busy={isSaving}>
    <h1 className="sr-only">{entryToEdit ? 'Editar entrada' : 'Nueva entrada'}</h1>
    <header className="entry-command-bar">
      <button type="button" className="editor-back-btn" disabled={isSaving} onClick={onBack}><ArrowLeft size={18} aria-hidden /><span>Bitácora</span></button>
      <span className={`entry-draft-status ${draft.status === 'error' ? 'is-error' : ''}`} title="El borrador se guarda solo en este dispositivo. Guardar entrada envía una copia a tu cuenta."><StatusIcon size={14} aria-hidden />{statusText}</span>
      <button type="button" className="btn-primary editor-save-button editor-save-button--desktop" onClick={() => void save()} disabled={isSaving}>{isSaving ? 'Guardando…' : 'Guardar entrada'}</button>
    </header>
    {!online && <p className="entry-notice" role="status"><CloudOff size={16} aria-hidden />Sin conexión. Sigue escribiendo y guarda en tu cuenta cuando vuelvas.</p>}
    {error && <p id="entry-save-error" className="form-error" role="alert">{error}</p>}
    {draft.status === 'error' && <div className="entry-storage-error" role="alert"><p>No pudimos proteger tu borrador en este dispositivo. Mantén esta página abierta o copia tu texto antes de salir.</p><button className="btn-secondary" type="button" onClick={() => draft.flush()}>Reintentar borrador</button></div>}
    {draft.restored && <p className="entry-notice">Retomaste un borrador de este dispositivo. Todavía tienes que guardarlo en tu cuenta.</p>}
    <div className="entry-context-row">
      <label htmlFor="entry-wrapper">Guardar en</label>
      <select id="entry-wrapper" value={values.themeId} onChange={e => update('themeId', e.target.value)} disabled={isSaving} className="select-custom">{themes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
      <div className="editor-mode-toggle" role="group" aria-label="Vista del editor">
        <button type="button" className={`editor-mode-btn ${mode === 'write' ? 'active' : ''}`} onClick={() => setMode('write')} aria-pressed={mode === 'write'}><Edit3 size={15} aria-hidden /><span>Escribir</span></button>
        <button type="button" className={`editor-mode-btn editor-mode-btn--split ${mode === 'split' ? 'active' : ''}`} onClick={() => setMode('split')} aria-pressed={mode === 'split'}><Columns size={15} aria-hidden /><span>Dividido</span></button>
        <button type="button" className={`editor-mode-btn ${mode === 'preview' ? 'active' : ''}`} onClick={() => setMode('preview')} aria-pressed={mode === 'preview'}><Eye size={15} aria-hidden /><span>Vista previa</span></button>
      </div>
    </div>
    {mode !== 'preview' && <div className="editor-markdown-toolbar" role="group" aria-label="Formato Markdown">
      {formats.map(({ label, icon: Icon, prefix, suffix, placeholder, block }) => <button key={label} type="button" className="toolbar-btn" aria-label={label} title={label} disabled={isSaving} onPointerDown={e => e.preventDefault()} onClick={() => format(prefix, suffix, placeholder, block)}><Icon size={18} aria-hidden /></button>)}
      <button type="button" className="toolbar-btn" aria-label="Ayuda de formato" aria-expanded={help} aria-controls="entry-format-help" onClick={() => setHelp(v => !v)}><HelpCircle size={18} aria-hidden /></button>
    </div>}
    {help && <aside id="entry-format-help" className="entry-notice"><p>Puedes escribir sin formato. Usa los botones para dar énfasis o prueba <code>## Sección</code>, <code>**negrita**</code> y <code>- lista</code>.</p><p>Ctrl/⌘ + B: negrita · Ctrl/⌘ + I: cursiva · Ctrl/⌘ + S: guardar. Tab pasa al siguiente control.</p></aside>}
    {mode === 'split' ? <div className="editor-split-container">{canvas}{preview}</div> : mode === 'preview' ? preview : canvas}
    <div className="entry-writing-footer"><span>{wordCount} {wordCount === 1 ? 'palabra' : 'palabras'}</span><span>Solo tú puedes ver esta entrada.</span></div>
    <details className="entry-details"><summary>Detalles de la entrada <span>Fecha, etiquetas y resumen</span></summary><fieldset disabled={isSaving}>
      <label htmlFor="entry-date">Fecha<input id="entry-date" type="date" value={values.date} onChange={e => update('date', e.target.value)} className="input-text" required /></label>
      <label htmlFor="entry-tags">Etiquetas · opcional<input id="entry-tags" value={values.tagsInput} onChange={e => update('tagsInput', e.target.value)} placeholder="lectura, calma" className="input-text" aria-describedby="entry-tags-help" /><small id="entry-tags-help">Sepáralas con comas.</small></label>
      <label htmlFor="entry-summary">Resumen · opcional<textarea id="entry-summary" rows={3} value={values.summary} onChange={e => update('summary', e.target.value)} className="textarea-custom" /></label>
      {(draft.restored || draft.status === 'local') && <button type="button" className="entry-discard" onClick={() => { if (window.confirm(entryToEdit ? '¿Descartar los cambios del borrador y volver a la entrada guardada?' : '¿Descartar este borrador y empezar de nuevo?')) { try { draft.discard(); setError(null); } catch { setError('No pudimos descartar el borrador. Tu texto sigue aquí.'); } } }}>Descartar {entryToEdit ? 'cambios del borrador' : 'borrador'}</button>}
    </fieldset></details>
    <div className="editor-mobile-actions" role="group" aria-label="Acciones del editor"><span className={`editor-mobile-status ${draft.status === 'error' ? 'is-error' : ''}`}><StatusIcon size={14} aria-hidden />{statusText}</span><button type="button" onClick={() => void save()} disabled={isSaving} className="btn-primary editor-save-button">{isSaving ? 'Guardando…' : 'Guardar entrada'}</button></div>
  </section>;
};
