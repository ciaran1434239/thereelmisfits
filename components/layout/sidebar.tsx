// components/layout/sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home, Compass, Flame, PlayCircle, BarChart3, Newspaper,
  Mic2, Users, Edit3, Check,
} from 'lucide-react';
import { useSidebar } from '@/lib/context/sidebar-context';
import { cn } from '@/lib/utils/cn';
import { Avatar } from '@/components/ui/avatar';
import type { Reviewer } from '@/lib/types';

interface SidebarProps {
  /** A few subscribed channels to render in the expanded view. */
  subscribedChannels: Reviewer[];
}

interface NavItem {
  href: string;
  label: string;
  icon: typeof Home;
  divider?: boolean;
}

const navItems: NavItem[] = [
  { href: '/',            label: 'Home',          icon: Home },
  { href: '/browse',      label: 'Browse',        icon: Compass },
  { href: '/trending',    label: 'Trending',      icon: Flame },
  { href: '/subs',        label: 'Subscriptions', icon: PlayCircle, divider: true },
  { href: '/box-office',  label: 'Box Office',    icon: BarChart3 },
  { href: '/news',        label: 'News',          icon: Newspaper },
  { href: '/features',    label: 'Features',      icon: Mic2 },
  { href: '/channels',    label: 'Channels',      icon: Users, divider: true },
  { href: '/score',       label: 'Score a film',  icon: Edit3 },
];

export function Sidebar({ subscribedChannels }: SidebarProps) {
  const { expanded } = useSidebar();
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  if (!expanded) {
    // Collapsed rail — first four nav items only, icon-over-label.
    return (
      <aside
        aria-label="Primary navigation"
        className="w-[76px] shrink-0 bg-surface sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto py-2"
      >
        {navItems.slice(0, 4).map((it) => (
          <Link
            key={it.href}
            href={it.href}
            className={cn(
              'w-full py-3.5 flex flex-col items-center gap-1.5 hover:bg-surface-alt rounded-xl mx-2',
              isActive(it.href) && 'bg-surface-alt'
            )}
          >
            <it.icon size={20} />
            <span className="text-[10px] font-medium">{it.label}</span>
          </Link>
        ))}
      </aside>
    );
  }

  return (
    <aside
      aria-label="Primary navigation"
      className="w-60 shrink-0 bg-surface sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto py-3 px-3"
    >
      {navItems.map((it) => (
        <div key={it.href}>
          <Link
            href={it.href}
            className={cn(
              'w-full py-2.5 px-3 rounded-[10px] flex items-center gap-6 text-sm transition-colors',
              isActive(it.href)
                ? 'bg-surface-alt font-semibold'
                : 'hover:bg-surface-hover font-normal'
            )}
          >
            <it.icon size={20} />
            {it.label}
          </Link>
          {it.divider && <div className="h-px bg-border my-2" />}
        </div>
      ))}

      <div className="h-px bg-border my-2" />

      <div className="px-3">
        <div className="text-[13px] text-subtle font-semibold mb-3">
          Subscriptions
        </div>
        {subscribedChannels.map((r) => (
          <Link
            key={r.id}
            href={`/channel/${r.handle}`}
            className="w-full py-2 flex items-center gap-3 hover:bg-surface-hover rounded-md -mx-2 px-2"
          >
            <Avatar reviewer={r} size="xs" />
            <span className="text-[13px] flex-1 min-w-0 truncate">
              {r.name}
            </span>
            {r.verified && <Check size={11} className="text-subtle shrink-0" />}
          </Link>
        ))}
      </div>

      <div className="h-px bg-border my-2" />

      <div className="px-3 py-3 text-[11px] text-faint leading-loose">
        About · Press · Terms · Privacy<br />
        © 2026 TheySaid
      </div>
    </aside>
  );
}
