import { useEffect, useState, useSyncExternalStore, type ReactNode } from 'react';
import { createPresenceController, type PresenceSurface } from '../utils/companionPresence';
import { CompanionPresenceContext } from '../hooks/useCompanionPresence';

export function PresenceProvider({ surface, confirmation = 0, enabled = true, children }: { surface: PresenceSurface; confirmation?: number; enabled?: boolean; children: ReactNode }) {
  const [controller] = useState(() => createPresenceController(surface, () => performance.now(), confirmation));
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot);
  useEffect(() => { controller.transition(surface, confirmation); }, [controller, surface, confirmation]);
  useEffect(() => {
    if (!enabled || !state.expiresAt) return;
    let timer = 0;
    const expire = () => {
      const remaining = state.expiresAt - performance.now();
      if (remaining > 0) timer = window.setTimeout(expire, Math.ceil(remaining));
      else controller.tick();
    };
    timer = window.setTimeout(expire, Math.max(1, Math.ceil(state.expiresAt - performance.now())));
    return () => window.clearTimeout(timer);
  }, [controller, enabled, state.expiresAt]);
  return <CompanionPresenceContext.Provider value={enabled ? controller : null}>{children}</CompanionPresenceContext.Provider>;
}
