import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { BigTheme, BlogEntry } from '../types';

export interface WrapperMetrics {
  totalEntries: number;
  lastEntryDate?: string;
}

interface WrapperContextValue {
  wrappers: BigTheme[];
  activeWrapperId: string | null;
  activeWrapper: BigTheme | null;
  setActiveWrapperId: (id: string | null) => void;
  getWrapperById: (id: string) => BigTheme | undefined;
  getWrapperMetrics: (id: string) => WrapperMetrics;
  scopedEntries: BlogEntry[];
}

const WrapperContext = createContext<WrapperContextValue | undefined>(undefined);

interface WrapperProviderProps {
  children: React.ReactNode;
  wrappers: BigTheme[];
  activeWrapperId: string | null;
  setActiveWrapperId: (id: string | null) => void;
  blogEntries: BlogEntry[];
}

export const WrapperProvider: React.FC<WrapperProviderProps> = ({
  children,
  wrappers,
  activeWrapperId,
  setActiveWrapperId,
  blogEntries,
}) => {
  const activeWrapper = useMemo(() => {
    if (!activeWrapperId) return null;
    return wrappers.find(w => w.id === activeWrapperId) || null;
  }, [activeWrapperId, wrappers]);

  // Dynamic ambient theming on the root element
  useEffect(() => {
    if (activeWrapper) {
      document.documentElement.setAttribute('data-ambient-wrapper', activeWrapper.color);
    } else {
      document.documentElement.removeAttribute('data-ambient-wrapper');
    }

    return () => {
      document.documentElement.removeAttribute('data-ambient-wrapper');
    };
  }, [activeWrapper]);

  const getWrapperById = (id: string) => {
    return wrappers.find(w => w.id === id);
  };

  const getWrapperMetrics = (id: string): WrapperMetrics => {
    const entries = blogEntries.filter(b => b.themeId === id);

    let lastEntryDate: string | undefined;
    if (entries.length > 0) {
      const sorted = [...entries].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      lastEntryDate = sorted[0].date;
    }

    return {
      totalEntries: entries.length,
      lastEntryDate,
    };
  };

  const scopedEntries = useMemo(() => {
    if (!activeWrapperId) return blogEntries;
    return blogEntries.filter(b => b.themeId === activeWrapperId);
  }, [activeWrapperId, blogEntries]);

  return (
    <WrapperContext.Provider
      value={{
        wrappers,
        activeWrapperId,
        activeWrapper,
        setActiveWrapperId,
        getWrapperById,
        getWrapperMetrics,
        scopedEntries,
      }}
    >
      {children}
    </WrapperContext.Provider>
  );
};

export const useWrapper = (): WrapperContextValue => {
  const context = useContext(WrapperContext);
  if (!context) {
    throw new Error('useWrapper must be used within a WrapperProvider');
  }
  return context;
};
