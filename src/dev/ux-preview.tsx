// Local review harness. Not imported by the application or emitted by its production build.
import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import '../index.css';
import './ux-preview.css';
import { Navbar } from '../components/Navbar';
import { BottomNav } from '../components/BottomNav';
import { Dashboard } from '../components/Dashboard';
import { BlogJournal } from '../components/BlogJournal';
import { BlogEditorPage } from '../components/BlogEditorPage';
import { BlogEntryViewPage } from '../components/BlogEntryViewPage';
import { ThemeModal } from '../components/ThemeModal';
import { QuickActionSheet } from '../components/QuickActionSheet';
import { getCountdownTo2027 } from '../utils/dates';
import type { ActiveTab, BigTheme, BlogEntry, UserProfile } from '../types';
import type { User } from '@supabase/supabase-js';
import { ProfilePage } from '../components/ProfilePage';
import { isAvatarCharacterId } from '../utils/avatarCharacters';
import { recordCompanionPreview } from './record-companion';
import { canLeaveEntry, pendingEntryDrafts } from '../utils/entryDraft';
import { PresenceProvider } from '../context/CompanionPresenceContext';
import { useCompanionPresence } from '../hooks/useCompanionPresence';
import { presenceSurfaceForTab } from '../utils/companionPresence';
import { usePresenceMetrics } from './presence-metrics';

const OWNER = 'ux-synthetic-review';
const stamp = '2026-10-17T10:00:00Z';
const sampleThemes: BigTheme[] = [
  { id: 'demo-learning', name: 'Aprender con calma', description: 'Pequeños descubrimientos y pasos que quiero recordar.', color: 'teal', icon: 'BookOpen', priority: 'media', targetGoals2027: ['Leer un poco cada semana'], createdAt: stamp, updatedAt: stamp },
  { id: 'demo-days', name: 'Días cotidianos', description: 'Lo que me ayuda a prestar atención.', color: 'peach', icon: 'Target', priority: 'alta', targetGoals2027: [], createdAt: stamp, updatedAt: stamp },
];
const sampleEntries: BlogEntry[] = [
  { id: 'demo-entry-one', title: 'Un paso pequeño también cuenta', themeId: 'demo-learning', date: '2026-10-18', summary: 'Reservar diez minutos fue suficiente para volver a empezar.', content: '## Lo que aprendí\n\nReservé diez minutos para leer sin prisa. Al terminar, anoté una sola idea.\n\n> Puedo avanzar sin resolverlo todo hoy.\n\n## Para mañana\n\n- Volver a abrir el cuaderno.\n- Elegir una idea y probarla.', tags: ['lectura', 'calma'], readTimeMinutes: 1, createdAt: stamp, updatedAt: stamp },
  { id: 'demo-entry-two', title: 'Una tarde sin planes', themeId: 'demo-days', date: '2026-10-16', summary: 'Caminar me ayudó a ordenar las ideas.', content: 'Salí a caminar y dejé que las ideas encontraran su lugar. No hacía falta una conclusión.\n\nMañana quiero repetirlo.', tags: ['paseo'], readTimeMinutes: 1, createdAt: stamp, updatedAt: stamp },
];
const reviewParams = new URLSearchParams(window.location.search);
const scenario = reviewParams.get('scenario') || 'sample';
function entriesForScenario(value: string): BlogEntry[] {
  if (value === 'empty') return [];
  return sampleEntries.map((entry, index) => {
    if (value !== 'long' || index !== 0) return entry;
    const content = `${Array(70).fill(entry.content).join('\n\n')}\n\nhttps://example.invalid/${'long-link-'.repeat(40)}\n\n| Idea | Detalle |\n| --- | --- |\n| Paso | ${'contenido'.repeat(20)} |\n\n\`\`\`text\n${'código largo '.repeat(40)}\n\`\`\``;
    return { ...entry, content, readTimeMinutes: Math.max(1, Math.ceil(content.trim().split(/\s+/).length / 180)) };
  });
}
const initialView = ['dashboard', 'blog', 'editor', 'entry', 'profile'].includes(reviewParams.get('view') || '') ? reviewParams.get('view') as ActiveTab : 'dashboard';
const initialFault = ['failure', 'slow', 'expired'].includes(reviewParams.get('fault') || '') ? reviewParams.get('fault')! : 'normal';
const demoUser = { id: OWNER, email: 'alex@example.invalid', app_metadata: {}, user_metadata: {}, aud: 'authenticated', created_at: stamp } as User;

function PresenceReviewState() {
  const { enabled, state } = useCompanionPresence();
  return <output hidden data-presence-review-state={state.cue} data-presence-enabled={enabled} data-presence-confirmation={Boolean(state.confirmation)} />;
}

export function Preview() {
  const [tab, setTab] = useState<ActiveTab>(initialView);
  const [demoProfile, setDemoProfile] = useState<UserProfile>(() => {
    const saved = reviewParams.get('character') || localStorage.getItem('horizon:ux-synthetic-review:profile-character');
    return { id: OWNER, displayName: 'Alex', bio: 'Un día a la vez.', cycleStartDate: '2026-10-17', avatarPath: null, avatarVersion: 0, avatarCharacter: isAvatarCharacterId(saved) ? saved : 'otter', createdAt: stamp, updatedAt: stamp };
  });
  const [themes, setThemes] = useState(scenario === 'empty' ? [] : sampleThemes);
  const [entries, setEntries] = useState(() => entriesForScenario(scenario));
  const [reviewScenario, setReviewScenario] = useState(scenario);
  const [selected, setSelected] = useState<string | null>(initialView === 'entry' ? sampleEntries[0].id : null);
  const [editing, setEditing] = useState<BlogEntry | null>(null);
  const [wrapper, setWrapper] = useState<string | null>(null);
  const [themeModal, setThemeModal] = useState(false);
  const [quick, setQuick] = useState(false);
  const [fault, setFault] = useState(initialFault);
  const [presentation, setPresentation] = useState(reviewParams.get('presentation') === 'baseline' ? 'baseline' : 'revision');
  const presenceEnabled = presentation !== 'baseline';
  const { measurement, start: startMetrics, cancel: cancelMetrics } = usePresenceMetrics(presentation);
  const [resumeNotice, setResumeNotice] = useState('');
  const [revision, setRevision] = useState(0);
  const [query, setQuery] = useState('');
  const [confirmed, setConfirmed] = useState<string | null>(null);
  const [presenceConfirmation, setPresenceConfirmation] = useState(0);
  const [storageBlocked, setStorageBlocked] = useState(false);
  const [offlineSimulation, setOfflineSimulation] = useState(false);
  const offlineSimulationSupported = Object.getOwnPropertyDescriptor(navigator, 'onLine')?.configurable ?? Object.isExtensible(navigator);
  const [audit, setAudit] = useState('');
  const [keyboard, setKeyboard] = useState(false);
  const [insets, setInsets] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordingError, setRecordingError] = useState('');
  const continueWriting = React.useRef(false);
  const navigate = (next: ActiveTab) => { if (canLeaveEntry()) setTab(next); };
  useEffect(() => { window.scrollTo(0, 0); }, [tab, selected, revision]);
  useEffect(() => {
    const original = Storage.prototype.setItem;
    if (storageBlocked) Storage.prototype.setItem = function(key, value) {
      if (key.startsWith(`horizon:${OWNER}:`)) throw new DOMException('Synthetic quota failure', 'QuotaExceededError');
      return original.call(this, key, value);
    };
    return () => { Storage.prototype.setItem = original; };
  }, [storageBlocked]);
  useEffect(() => {
    if (!import.meta.env.DEV || !offlineSimulation) return;
    const original = Object.getOwnPropertyDescriptor(navigator, 'onLine');
    const installed = Reflect.defineProperty(navigator, 'onLine', { configurable: true, enumerable: original?.enumerable ?? true, get: () => false });
    if (!installed) return;
    window.dispatchEvent(new Event('offline'));
    return () => {
      if (original) Object.defineProperty(navigator, 'onLine', original);
      else Reflect.deleteProperty(navigator, 'onLine');
      window.dispatchEvent(new Event(navigator.onLine ? 'online' : 'offline'));
    };
  }, [offlineSimulation]);
  useEffect(() => {
    document.documentElement.classList.toggle('keyboard-open', keyboard);
    return () => document.documentElement.classList.remove('keyboard-open');
  }, [keyboard]);
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--android-inset-top', insets ? '24px' : '0px');
    root.style.setProperty('--android-inset-bottom', insets ? '48px' : '0px');
    return () => { root.style.removeProperty('--android-inset-top'); root.style.removeProperty('--android-inset-bottom'); };
  }, [insets]);
  const runAudit = async () => {
    setAudit('Comprobando…');
    const { default: axe } = await import('axe-core');
    const result = await axe.run({ exclude: [['.ux-lab']] }, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] } });
    setAudit(JSON.stringify({ violations: result.violations.map(v => ({ id: v.id, impact: v.impact, targets: v.nodes.map(n => n.target), details: v.nodes.map(n => n.failureSummary) })), incomplete: result.incomplete.map(v => v.id), manualChecks: result.incomplete.map(v => ({ id: v.id, targets: v.nodes.map(n => n.target), details: v.nodes.map(n => n.failureSummary) })) }, null, 2));
  };
  useEffect(() => {
    if (reviewParams.get('audit') !== '1') return;
    const frame = requestAnimationFrame(() => { void runAudit(); });
    return () => cancelAnimationFrame(frame);
  }, [tab]);
  const openEditor = (entry?: BlogEntry, themeId?: string) => {
    if (!canLeaveEntry()) return;
    if (!themes.length && !entry) { continueWriting.current = true; setThemeModal(true); return; }
    setEditing(entry || null); setWrapper(themeId || null); setRevision(n => n + 1); setTab('editor');
  };
  const openReader = (entry: BlogEntry) => { if (!canLeaveEntry()) return; setSelected(entry.id); setTab('entry'); };
  const perform = async () => {
    await new Promise(resolve => setTimeout(resolve, fault === 'slow' ? 3500 : 250));
    if (fault === 'failure') throw new Error('No pudimos guardar en tu cuenta. Tu texto sigue aquí. Vuelve a intentarlo.');
    if (fault === 'expired') throw new Error('Tu sesión ha caducado. Conserva tu borrador y vuelve a iniciar sesión.');
  };
  const active = entries.find(e => e.id === selected);
  return <>
    <details className="ux-lab"><summary>Revisión local · solo datos ficticios</summary><div className="ux-lab-controls">
      <label>Presentación <select aria-label="Presentación" value={presentation} onChange={e => {
        if (!canLeaveEntry()) return;
        setPresentation(e.target.value);
        const url = new URL(window.location.href);
        url.searchParams.set('presentation', e.target.value);
        window.history.replaceState(null, '', url);
      }}><option value="baseline">Base</option><option value="revision">Revisión</option></select></label>
      <label>Escenario <select aria-label="Escenario de revisión" value={reviewScenario} onChange={e => { if (!canLeaveEntry()) return; setReviewScenario(e.target.value); setThemes(e.target.value === 'empty' ? [] : sampleThemes); setEntries(entriesForScenario(e.target.value)); setTab('dashboard'); }}><option value="sample">Cuenta con entradas</option><option value="empty">Cuenta vacía</option><option value="long">Entrada larga</option></select></label>
      <label>Guardado <select aria-label="Simular guardado" value={fault} onChange={e => setFault(e.target.value)}><option value="normal">Normal</option><option value="slow">Lento · 3,5 s</option><option value="failure">Error de conexión</option><option value="expired">Sesión caducada</option></select></label>
      <label><input type="checkbox" checked={offlineSimulation} disabled={!offlineSimulationSupported} onChange={e => setOfflineSimulation(e.target.checked)} />Simular sin conexión</label>
      {!offlineSimulationSupported && <p>Este navegador no permite simular el estado de conexión.</p>}
      <label><input type="checkbox" checked={storageBlocked} onChange={e => setStorageBlocked(e.target.checked)} />Simular almacenamiento lleno</label>
      <label><input type="checkbox" checked={keyboard} onChange={e => setKeyboard(e.target.checked)} />Simular clase de teclado Android</label>
      <label><input type="checkbox" checked={insets} onChange={e => setInsets(e.target.checked)} />Simular barras Android · 24 / 48 px</label>
      <button type="button" className="btn-secondary" onClick={() => {
        const draft = pendingEntryDrafts(OWNER, entries)[0];
        if (draft) { setResumeNotice(''); openEditor(entries.find(entry => entry.id === draft.entryId)); }
        else setResumeNotice('Todavía no hay un borrador local que reanudar.');
      }}>Reanudar último borrador</button>
      {resumeNotice && <p role="status">{resumeNotice}</p>}
      <button type="button" className="btn-secondary" onClick={() => void runAudit()}>Comprobar accesibilidad</button>
      <button type="button" className="btn-secondary" disabled={measurement.status === 'running'} onClick={startMetrics}>Medir 20 s</button>
      {measurement.status === 'running' && <button type="button" className="btn-secondary" onClick={cancelMetrics}>Cancelar medición</button>}
      <output className="ux-audit-result" data-presence-metrics-state={measurement.status} aria-live="polite">{measurement.status === 'running' ? 'Midiendo 20 s. Mantén esta pestaña visible y realiza el mismo recorrido en ambas presentaciones.' : measurement.status === 'cancelled' ? measurement.reason : measurement.status === 'complete' ? JSON.stringify(measurement.result, null, 2) : 'Medición preparada. No captura texto ni valores de los campos.'}</output>
      <button type="button" className="btn-secondary" disabled={recording} onClick={async () => {
        setRecording(true); setRecordingError('');
        try {
          const blob = await recordCompanionPreview();
          const url = URL.createObjectURL(blob), link = document.createElement('a');
          link.href = url; link.download = 'horizon-companion-live.webm'; link.click();
          setTimeout(() => URL.revokeObjectURL(url), 30_000);
        } catch (error) { setRecordingError(error instanceof Error ? error.message : 'No se pudo grabar.'); }
        finally { setRecording(false); }
      }}>{recording ? 'Grabando el compañero…' : 'Grabar prueba del compañero'}</button>
      {recordingError && <p role="alert">{recordingError}</p>}
      {audit && <pre className="ux-audit-result" aria-label="Resultado de accesibilidad" data-audit-state={audit.includes('"violations"') ? 'complete' : 'pending'}>{audit}</pre>}
      <p>Sin conexión a Supabase. Las entradas de muestra se reinician al recargar; los borradores de revisión usan un propietario ficticio separado.</p>
    </div></details>
    <PresenceProvider key={presentation} surface={presenceSurfaceForTab(tab)} confirmation={presenceConfirmation} enabled={presenceEnabled}>
    <PresenceReviewState />
    <div className={`app-shell${presenceEnabled ? ' presence-shell' : ''}`}>
      <Navbar activeTab={tab} setActiveTab={navigate} onOpenQuickEntry={() => openEditor()} userEmail="alex@example.invalid" userDisplayName={demoProfile.displayName} userAvatarCharacter={demoProfile.avatarCharacter} onOpenAuth={() => navigate('profile')} />
      <main className="app-main-layout" id="main-content">
        {tab === 'entry' && confirmed === selected && <p className={`entry-saved-confirmation${presenceEnabled ? ' presence-saved-confirmation' : ''}`} role="status">{presenceEnabled ? <span><strong>Entrada guardada en tu cuenta.</strong><small>Puedes volver a ella cuando quieras.</small></span> : 'Entrada guardada en tu cuenta.'}<button type="button" aria-label="Cerrar confirmación" onClick={() => setConfirmed(null)}>×</button></p>}
        {tab === 'dashboard' && <Dashboard presenceEnabled={presenceEnabled} userId={OWNER} themes={themes} blogEntries={entries} countdown={getCountdownTo2027()} setActiveTab={navigate} onSelectBlogEntry={openReader} onSelectThemeFilter={id => { setWrapper(id); navigate('blog'); }} onOpenQuickEntry={() => openEditor()} onCreateWrapper={() => { continueWriting.current = !themes.length; setThemeModal(true); }} onWriteForTheme={id => openEditor(undefined, id)} onOpenWrapperStudio={id => { setWrapper(id); navigate('blog'); }} onResumeDraft={id => openEditor(entries.find(e => e.id === id))} />}
        {tab !== 'dashboard' && <div className="main-content" style={{ marginTop: 24 }}>
          {(tab === 'blog' || tab === 'themes') && <BlogJournal userId={OWNER} entries={entries} themes={themes} selectedThemeFilter={wrapper} onSelectThemeFilter={setWrapper} searchQuery={query} onSearchQueryChange={setQuery} onOpenCreateEntry={() => openEditor(undefined, wrapper || undefined)} onEditEntry={entry => openEditor(entry)} onOpenReader={openReader} onDeleteEntry={id => setEntries(all => all.filter(e => e.id !== id))} />}
          {tab === 'editor' && <BlogEditorPage key={revision} userId={OWNER} themes={themes} initialThemeId={wrapper} entryToEdit={editing} onBack={() => navigate('blog')} onSave={async entry => { await perform(); setEntries(all => [entry, ...all.filter(e => e.id !== entry.id)]); }} onSaved={entry => { setConfirmed(entry.id); setPresenceConfirmation(value => value + 1); openReader(entry); }} />}
          {tab === 'entry' && active && <BlogEntryViewPage key={active.id} entry={active} themes={themes} allEntries={entries} onBack={() => navigate('blog')} onEdit={entry => openEditor(entry)} onSelectEntry={setSelected} onDelete={async id => { await perform(); setEntries(all => all.filter(e => e.id !== id)); }} />}
          {tab === 'profile' && <ProfilePage user={demoUser} profile={demoProfile} avatarUrl={null} loading={false} error={null} onRetry={() => {}} accountActionsEnabled={false}
            onSave={async patch => { await perform(); setDemoProfile(p => ({ ...p, ...patch, displayName: patch.displayName?.trim() ?? p.displayName, bio: patch.bio?.trim() ?? p.bio, updatedAt: new Date().toISOString() })); }}
            onAvatarCharacterSelect={async avatarCharacter => { await perform(); localStorage.setItem('horizon:ux-synthetic-review:profile-character', avatarCharacter || 'otter'); setDemoProfile(p => ({ ...p, avatarCharacter, updatedAt: new Date().toISOString() })); }}
            onAvatarSave={async () => { throw new Error('Esta vista de revisión no envía fotos personales.'); }} onAvatarRemove={async () => {}} onSignOut={async () => {}} />}
          {tab === 'calendar' && <section className="empty-state"><h1>Calendario</h1><p>La recomposición se concentra en escribir, retomar y encontrar entradas.</p><button className="btn-secondary" onClick={() => setTab('blog')}>Ver bitácora</button></section>}
        </div>}
      </main>
      {tab !== 'editor' && <BottomNav activeTab={tab} setActiveTab={navigate} onOpenQuickAction={() => openEditor()} />}
      <QuickActionSheet isOpen={quick} onClose={() => setQuick(false)} onWriteEntry={() => openEditor()} onAddTheme={() => setThemeModal(true)} />
      <ThemeModal isOpen={themeModal} onClose={() => { continueWriting.current = false; setThemeModal(false); }} onSave={async theme => { await perform(); setThemes(all => [...all, theme]); if (continueWriting.current) { setEditing(null); setWrapper(theme.id); setRevision(n => n + 1); setTab('editor'); continueWriting.current = false; } }} />
    </div>
    </PresenceProvider>
  </>;
}

if (import.meta.env.DEV) createRoot(document.getElementById('root')!).render(<Preview />);
