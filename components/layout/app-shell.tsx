import { Header } from './header';
import { Footer } from './footer';
import type { ReactNode } from 'react';

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      <main role="main" style={{ backgroundColor: '#181818' }}>
        {children}
      </main>
      <Footer />
    </>
  );
}