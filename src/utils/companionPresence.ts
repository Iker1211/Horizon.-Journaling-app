/** UI signals only. Never pass account, entry or journal contents to the companion. */
export type PresenceCue = 'welcome' | 'available' | 'focus' | 'saving' | 'saved' | 'error';
export type PresenceSurface = 'home' | 'writing' | 'reading' | 'other';
export type CompanionPresence = { cue: PresenceCue; confirmation: number };

export function presenceSurfaceForTab(tab: string): PresenceSurface {
  return tab === 'dashboard' ? 'home' : tab === 'editor' ? 'writing' : tab === 'entry' ? 'reading' : 'other';
}

export type PresenceSnapshot = CompanionPresence & { surface: PresenceSurface; expiresAt: number };

/** Finite semantic transitions; no per-keystroke/frame updates, storage or network. */
export function createPresenceController(initialSurface: PresenceSurface, now: () => number = () => performance.now(), initialConfirmation = 0) {
  let surface = initialSurface;
  let operation: 'idle' | 'saving' | 'error' = 'idle';
  let confirmation = initialConfirmation;
  let welcomeUntil = surface === 'home' ? now() + 2600 : 0;
  let savedUntil = 0;
  const listeners = new Set<() => void>();
  const derive = (): PresenceSnapshot => {
    const time = now();
    const cue: PresenceCue = operation === 'error' ? 'error' : operation === 'saving' ? 'saving'
      : surface === 'writing' ? 'focus' : savedUntil > time ? 'saved'
        : welcomeUntil > time && surface === 'home' ? 'welcome' : 'available';
    const deadlines = [welcomeUntil, savedUntil].filter(deadline => deadline > time);
    return { cue, confirmation, surface, expiresAt: deadlines.length ? Math.min(...deadlines) : 0 };
  };
  let snapshot = derive();
  const publish = () => {
    const next = derive();
    if (next.cue === snapshot.cue && next.confirmation === snapshot.confirmation && next.surface === snapshot.surface && next.expiresAt === snapshot.expiresAt) return;
    snapshot = next;
    listeners.forEach(listener => listener());
  };
  return {
    getSnapshot: () => snapshot,
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    transition(next: PresenceSurface, confirmedSequence = confirmation) {
      if (next !== surface) { surface = next; welcomeUntil = 0; }
      if (confirmedSequence > confirmation) {
        confirmation = confirmedSequence;
        operation = 'idle';
        welcomeUntil = 0;
        savedUntil = now() + 4200;
      }
      publish();
    },
    editorState(saving: boolean, error: boolean) {
      operation = error ? 'error' : saving ? 'saving' : 'idle';
      if (saving || error) { savedUntil = 0; welcomeUntil = 0; }
      publish();
    },
    resetEditor() { operation = 'idle'; publish(); },
    tick: publish,
  };
}
export type PresenceController = ReturnType<typeof createPresenceController>;
