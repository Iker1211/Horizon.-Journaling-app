import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { Keyboard } from '@capacitor/keyboard';

/** Keep the bottom navigation out of the writing area while Android's keyboard is open. */
export function useMobileKeyboard() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let disposed = false;
    const handles: { remove: () => Promise<void> }[] = [];
    const keep = (handle: { remove: () => Promise<void> }) => {
      if (disposed) void handle.remove();
      else handles.push(handle);
    };
    void Keyboard.addListener('keyboardDidShow', () => {
      document.documentElement.classList.add('keyboard-open');
    }).then(keep).catch(() => {});
    void Keyboard.addListener('keyboardDidHide', () => {
      document.documentElement.classList.remove('keyboard-open');
    }).then(keep).catch(() => {});
    return () => {
      disposed = true;
      handles.forEach(handle => { void handle.remove(); });
      document.documentElement.classList.remove('keyboard-open');
    };
  }, []);
}
