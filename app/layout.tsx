// app/layout.tsx
import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { Bebas_Neue } from 'next/font/google';
import { Providers } from '@/components/layout/providers';
import { AppShell } from '@/components/layout/app-shell';
import './globals.css';

const bebasNeue = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'The Reel Misfits — YouTube film criticism, aggregated',
    template: '%s · The Reel Misfits',
  },
  description:
    'Honest film scores from the YouTube critics you actually trust. Not invited. Never stopped us.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable} ${bebasNeue.variable}`}
      suppressHydrationWarning
    >
      <body className="antialiased bg-bg text-ink">
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
