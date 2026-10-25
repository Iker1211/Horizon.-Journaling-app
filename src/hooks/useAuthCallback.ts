import { useEffect } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import type { SupabaseClient } from '@supabase/supabase-js';
import { completeAuthCallback } from '../services/authCallback';

interface AuthCallbackHandlers {
  onRecovery: () => void;
  onSuccess: (returnToProfile?: boolean) => void;
  onError: (message: string) => void;
}

export function useAuthCallback(client: SupabaseClient | null, handlers: AuthCallbackHandlers) {
  const { onRecovery, onSuccess, onError } = handlers;

  useEffect(() => {
    if (!client) return;
    let disposed = false;
    const cleanBrowserCallback = (profile = false) => {
      if (Capacitor.isNativePlatform()) return;
      window.history.replaceState(null, '', `${window.location.pathname}#/${profile ? 'profile' : 'dashboard'}`);
    };

    const completeCallback = async (rawUrl: string) => {
      const outcome = await completeAuthCallback(client, rawUrl);
      if (disposed || !outcome) return;
      cleanBrowserCallback(outcome.kind === 'success' && outcome.returnToProfile);
      if (outcome.kind === 'error') onError(outcome.message);
      else if (outcome.recovery) onRecovery();
      else onSuccess(outcome.returnToProfile);
    };

    void completeCallback(window.location.href);

    let removeListener: (() => Promise<void>) | undefined;
    if (Capacitor.isNativePlatform()) {
      void CapacitorApp.addListener('appUrlOpen', event => {
        void completeCallback(event.url);
      }).then(handle => {
        if (disposed) void handle.remove();
        else removeListener = () => handle.remove();
      });
      void CapacitorApp.getLaunchUrl().then(result => {
        if (result?.url) void completeCallback(result.url);
      }).catch(() => onError('No pudimos recuperar el acceso. Vuelve a intentarlo desde Horizon.'));
    }

    return () => {
      disposed = true;
      void removeListener?.();
    };
  }, [client, onError, onRecovery, onSuccess]);
}

