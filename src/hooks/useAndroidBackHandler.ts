import { useEffect, useRef } from 'react';
import { App as CapApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { ActiveTab } from '../types';

interface BackHandlerProps {
  hasOpenModal: boolean;
  closeModals: () => void;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

export function useAndroidBackHandler({
  hasOpenModal,
  closeModals,
  activeTab,
  setActiveTab,
}: BackHandlerProps) {
  const lastBackPressTime = useRef<number>(0);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let isMounted = true;
    let removeListener: (() => void) | null = null;

    const setupListener = async () => {
      const handle = await CapApp.addListener('backButton', () => {
        // 1. Si hay un modal u hoja abierta, cerrarlo prioritariamente
        if (hasOpenModal) {
          closeModals();
          return;
        }

        // 2. Si estamos en sub-vistas del editor o visor, regresar a la lista de bitácora
        if (activeTab === 'editor' || activeTab === 'entry') {
          setActiveTab('blog');
          window.location.hash = 'blog';
          return;
        }

        // 3. Si estamos en el estudio de wrapper, regresar a Wrappers
        if (activeTab === 'wrapper-studio') {
          setActiveTab('themes');
          window.location.hash = 'themes';
          return;
        }

        // 4. Si estamos en otra pestaña principal que no sea el Dashboard, volver al Dashboard
        if (activeTab !== 'dashboard') {
          setActiveTab('dashboard');
          window.location.hash = 'dashboard';
          return;
        }

        // 5. Si estamos en el Dashboard: Doble toque en menos de 2 segundos para salir
        const now = Date.now();
        if (now - lastBackPressTime.current < 2000) {
          CapApp.exitApp();
        } else {
          lastBackPressTime.current = now;
        }
      });

      if (isMounted) {
        removeListener = () => {
          handle.remove();
        };
      } else {
        handle.remove();
      }
    };

    setupListener();

    return () => {
      isMounted = false;
      if (removeListener) {
        removeListener();
      }
    };
  }, [hasOpenModal, closeModals, activeTab, setActiveTab]);
}
