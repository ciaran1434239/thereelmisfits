// lib/context/sidebar-context.tsx
'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';

interface SidebarContextValue {
  expanded: boolean;
  toggle: () => void;
  setExpanded: (v: boolean) => void;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function SidebarProvider({ children }: { children: ReactNode }) {
  // Default to expanded on desktop. Mobile-side handling lives in the layout
  // CSS (the sidebar collapses below md: anyway).
  const [expanded, setExpanded] = useState(true);
  const toggle = () => setExpanded((v) => !v);

  return (
    <SidebarContext.Provider value={{ expanded, toggle, setExpanded }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar(): SidebarContextValue {
  const ctx = useContext(SidebarContext);
  if (!ctx) {
    throw new Error('useSidebar must be used inside a SidebarProvider');
  }
  return ctx;
}
