import { useEffect, useState } from 'react';

const STORAGE_KEY = 'horizon:companion-motion';
const CHANGE_EVENT = 'horizon:companion-motion-change';

function readPreference() {
  try { return localStorage.getItem(STORAGE_KEY) !== 'paused'; } catch { return true; }
}

/** A device accessibility preference, never account or journal data. */
export function useCompanionPreference() {
  const [enabled, setEnabled] = useState(readPreference);
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onMedia = () => setReducedMotion(media.matches);
    const onStorage = (event: StorageEvent) => { if (event.key === STORAGE_KEY || event.key === null) setEnabled(readPreference()); };
    const onChange = (event: Event) => setEnabled((event as CustomEvent<boolean>).detail);
    media.addEventListener('change', onMedia);
    window.addEventListener('storage', onStorage);
    window.addEventListener(CHANGE_EVENT, onChange);
    return () => {
      media.removeEventListener('change', onMedia);
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(CHANGE_EVENT, onChange);
    };
  }, []);

  const changeEnabled = (value: boolean) => {
    setEnabled(value);
    try { localStorage.setItem(STORAGE_KEY, value ? 'active' : 'paused'); } catch { /* Session preference still works when storage is unavailable. */ }
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: value }));
  };

  return { enabled, reducedMotion, changeEnabled };
}
