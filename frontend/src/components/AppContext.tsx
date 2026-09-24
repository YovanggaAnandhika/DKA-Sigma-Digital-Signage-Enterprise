'use client';

import React, { createContext, useContext, useState } from 'react';

interface AppContextType {
  isFullscreen: boolean;
  setFullscreen: (val: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [isFullscreen, setFullscreen] = useState(false);

  return (
    <AppContext.Provider value={{ isFullscreen, setFullscreen }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within a AppProvider');
  }
  return context;
}
