import { createContext, useContext, useSyncExternalStore } from 'react';
import type { PresenceController, PresenceSnapshot } from '../utils/companionPresence';

export const CompanionPresenceContext = createContext<PresenceController | null>(null);
const inactive: PresenceSnapshot = { cue: 'available', confirmation: 0, surface: 'other', expiresAt: 0 };
const noSubscription = () => () => {};
const inactiveSnapshot = () => inactive;
const noActions = { editorState: (_saving: boolean, _error: boolean) => {}, resetEditor: () => {} };

export function useCompanionPresence() {
  const controller = useContext(CompanionPresenceContext);
  const state = useSyncExternalStore(controller?.subscribe ?? noSubscription, controller?.getSnapshot ?? inactiveSnapshot, inactiveSnapshot);
  return { enabled: Boolean(controller), state, actions: controller ?? noActions };
}
