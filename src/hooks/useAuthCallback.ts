import { useEffect } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import type { SupabaseClient } from '@supabase/supabase-js';
import { isRecoveryCallback, parseAuthCallbackUrl } from '../utils/authRedirect';

interface AuthCallbackHandlers {
  onRecovery: () => void;
  onSuccess: () => void;
  onError: (message: string) => void;
}

const CALLBACK_ERROR = 'El enlace no es válido o ha vencido. Solicita un código nuevo.';

export function useAuthCallback(client: SupabaseClient | null, handlers: AuthCallbackHandlers) {
  const { onRecovery, onSuccess, onError } = handlers;

  useEffect(() => {
    if (!client) return;
    let disposed = false;
    const processed = new Set<string>();

    const cleanBrowserCallback = () => {
      if (Capacitor.isNativePlatform()) return;
      window.history.replaceState(null, '', `${window.location.pathname}#/dashboard`);
    };

    const completeCallback = async (rawUrl: string) => {
      if (processed.has(rawUrl)) return;
      const callback = parseAuthCallbackUrl(rawUrl);
      if (!callback) return;
      processed.add(rawUrl);

      try {
        if (callback.error) throw new Error(callback.error);

        if (callback.accessToken && callback.refreshToken) {
          const { error } = await client.auth.setSession({
            access_token: callback.accessToken,
            refresh_token: callback.refreshToken,
          });
          if (error) throw error;
        } else if (callback.code) {
          const { error } = await client.auth.exchangeCodeForSession(callback.code);
          if (error) throw error;
        } else if (callback.tokenHash && callback.otpType) {
          const { error } = await client.auth.verifyOtp({
            token_hash: callback.tokenHash,
            type: callback.otpType,
          });
          if (error) throw error;
        } else {
          throw new Error('Missing authentication credentials');
        }

        if (disposed) return;
        cleanBrowserCallback();
        if (isRecoveryCallback(callback)) onRecovery();
        else onSuccess();
      } catch {
        if (disposed) return;
        cleanBrowserCallback();
        onError(CALLBACK_ERROR);
      }
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
      });
    }

    return () => {
      disposed = true;
      void removeListener?.();
    };
  }, [client, onError, onRecovery, onSuccess]);
}

