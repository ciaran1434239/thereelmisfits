'use client';

import { usePathname } from 'next/navigation';
import { Header } from './header';
import { Footer } from './footer';
import type { ReactNode, CSSProperties } from 'react';

const isLight = (path: string) => path === '/' || path.startsWith('/movie/');

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const light = isLight(pathname);
  const bg = light ? '#FFFFFF' : '#181818';

  return (
    <div
      className={light ? 'shell-light' : ''}
      style={{ '--shell-bg': bg, backgroundColor: bg } as CSSProperties}
    >
      <Header />
      <main role="main">{children}</main>
      <Footer />
    </div>
  );
}
