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
import { canLeaveEntry } from '../utils/entryDraft';

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
const reviewEntries = scenario === 'empty' ? [] : sampleEntries.map((entry, index) => scenario === 'long' && index === 0 ? { ...entry, content: `${entry.content.repeat(70)}\n\nhttps://example.invalid/${'long-link-'.repeat(40)}\n\n| Idea | Detalle |\n| --- | --- |\n| Paso | ${'contenido'.repeat(20)} |\n\n\`\`\`text\n${'código largo '.repeat(40)}\n\`\`\`` } : entry);
const initialView = ['dashboard', 'blog', 'editor', 'entry', 'profile'].includes(reviewParams.get('view') || '') ? reviewParams.get('view') as ActiveTab : 'dashboard';
const demoUser = { id: OWNER, email: 'alex@example.invalid', app_metadata: {}, user_metadata: {}, aud: 'authenticated', created_at: stamp } as User;

export function Preview() {
  const [tab, setTab] = useState<ActiveTab>(initialView);
  const [demoProfile, setDemoProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('horizon:ux-synthetic-review:profile-character');
    return { id: OWNER, displayName: 'Alex', bio: 'Un día a la vez.', cycleStartDate: '2026-10-17', avatarPath: null, avatarVersion: 0, avatarCharacter: isAvatarCharacterId(saved) ? saved : 'otter', createdAt: stamp, updatedAt: stamp };
  });
  const [themes, setThemes] = useState(scenario === 'empty' ? [] : sampleThemes);
  const [entries, setEntries] = useState(reviewEntries);
  const [selected, setSelected] = useState<string | null>(initialView === 'entry' ? sampleEntries[0].id : null);
  const [editing, setEditing] = useState<BlogEntry | null>(null);
  const [wrapper, setWrapper] = useState<string | null>(null);
  const [themeModal, setThemeModal] = useState(false);
  const [quick, setQuick] = useState(false);
  const [fault, setFault] = useState('normal');
  const [revision, setRevision] = useState(0);
  const [query, setQuery] = useState('');
  const [confirmed, setConfirmed] = useState<string | null>(null);
  const [storageBlocked, setStorageBlocked] = useState(false);
  const [audit, setAudit] = useState('');
  const [keyboard, setKeyboard] = useState(false);
  const [insets, setInsets] = useState(false);
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
    setAudit(JSON.stringify({ violations: result.violations.map(v => ({ id: v.id, impact: v.impact, targets: v.nodes.map(n => n.target), details: v.nodes.map(n => n.failureSummary) })), incomplete: result.incomplete.map(v => v.id) }, null, 2));
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
      <label>Escenario <select aria-label="Escenario de revisión" defaultValue={scenario} onChange={e => { setThemes(e.target.value === 'empty' ? [] : sampleThemes); setEntries(e.target.value === 'empty' ? [] : sampleEntries.map((v, i) => e.target.value === 'long' && i === 0 ? { ...v, content: v.content.repeat(70) } : v)); setTab('dashboard'); }}><option value="sample">Cuenta con entradas</option><option value="empty">Cuenta vacía</option><option value="long">Entrada larga</option></select></label>
      <label>Guardado <select aria-label="Simular guardado" value={fault} onChange={e => setFault(e.target.value)}><option value="normal">Normal</option><option value="slow">Lento · 3,5 s</option><option value="failure">Error de conexión</option><option value="expired">Sesión caducada</option></select></label>
      <label><input type="checkbox" checked={storageBlocked} onChange={e => setStorageBlocked(e.target.checked)} />Simular almacenamiento lleno</label>
      <label><input type="checkbox" checked={keyboard} onChange={e => setKeyboard(e.target.checked)} />Simular clase de teclado Android</label>
      <label><input type="checkbox" checked={insets} onChange={e => setInsets(e.target.checked)} />Simular barras Android · 24 / 48 px</label>
      <button type="button" className="btn-secondary" onClick={() => void runAudit()}>Comprobar accesibilidad</button>
      {audit && <pre className="ux-audit-result" aria-label="Resultado de accesibilidad" data-audit-state={audit.includes('"violations"') ? 'complete' : 'pending'}>{audit}</pre>}
      <p>Sin conexión a Supabase. Las entradas de muestra se reinician al recargar; los borradores de revisión usan un propietario ficticio separado.</p>
    </div></details>
    <div className="app-shell">
      <Navbar activeTab={tab} setActiveTab={navigate} onOpenQuickEntry={() => openEditor()} userEmail="alex@example.invalid" userDisplayName={demoProfile.displayName} userAvatarCharacter={demoProfile.avatarCharacter} onOpenAuth={() => navigate('profile')} />
      <main className="app-main-layout" id="main-content">
        {tab === 'entry' && confirmed === selected && <p className="entry-saved-confirmation" role="status">Entrada guardada en tu cuenta.<button type="button" aria-label="Cerrar confirmación" onClick={() => setConfirmed(null)}>×</button></p>}
        {tab === 'dashboard' && <Dashboard userId={OWNER} themes={themes} blogEntries={entries} countdown={getCountdownTo2027()} setActiveTab={navigate} onSelectBlogEntry={openReader} onSelectThemeFilter={id => { setWrapper(id); navigate('blog'); }} onOpenQuickEntry={() => openEditor()} onCreateWrapper={() => { continueWriting.current = !themes.length; setThemeModal(true); }} onWriteForTheme={id => openEditor(undefined, id)} onOpenWrapperStudio={id => { setWrapper(id); navigate('blog'); }} onResumeDraft={id => openEditor(entries.find(e => e.id === id))} />}
        {tab !== 'dashboard' && <div className="main-content" style={{ marginTop: 24 }}>
          {(tab === 'blog' || tab === 'themes') && <BlogJournal userId={OWNER} entries={entries} themes={themes} selectedThemeFilter={wrapper} onSelectThemeFilter={setWrapper} searchQuery={query} onSearchQueryChange={setQuery} onOpenCreateEntry={() => openEditor(undefined, wrapper || undefined)} onEditEntry={entry => openEditor(entry)} onOpenReader={openReader} onDeleteEntry={id => setEntries(all => all.filter(e => e.id !== id))} />}
          {tab === 'editor' && <BlogEditorPage key={revision} userId={OWNER} themes={themes} initialThemeId={wrapper} entryToEdit={editing} onBack={() => navigate('blog')} onSave={async entry => { await perform(); setEntries(all => [entry, ...all.filter(e => e.id !== entry.id)]); }} onSaved={entry => { setConfirmed(entry.id); openReader(entry); }} />}
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
  </>;
}

if (import.meta.env.DEV) createRoot(document.getElementById('root')!).render(<Preview />);
