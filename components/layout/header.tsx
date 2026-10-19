'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Search, Menu, X, LogIn, LogOut, User, ChevronDown, Film, Tv } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { Masthead } from './masthead';
import { useAuth } from '@/lib/context/auth-context';

interface SearchResult {
  id: number;
  title: string;
  type: 'movie' | 'tv';
  poster_path: string | null;
  href: string;
  hasReviews?: boolean;
  year?: string | null;
}

// ── Nav structure ─────────────────────────────────────────────────────────────

const NAV = [
  {
    label: 'Movies',
    href: '/movies',
    groups: [
      {
        heading: 'Now',
        items: [
          { label: 'In Cinemas Now', href: '/reviews?type=movie&sort=recent' },
          { label: 'Coming Soon',    href: '/reviews?type=movie' },
        ],
      },
      {
        heading: 'Ranked',
        items: [
          { label: 'Most Reviewed', href: '/reviews?type=movie&sort=count' },
          { label: 'Top Rated',     href: '/reviews?type=movie&sort=score' },
          { label: 'Best of 2025',  href: '/reviews?type=movie&sort=score' },
        ],
      },
    ],
  },
  {
    label: 'Ranked',
    href: '/ranked',
    groups: [
      {
        heading: 'Critics',
        items: [
          { label: 'Leaderboard', href: '/critics/league' },
          { label: 'Box Office',  href: '/box-office' },
        ],
      },
      {
        heading: 'Lists',
        items: [
          { label: 'The Lists', href: '/charts' },
          { label: 'Polls',     href: '/polls' },
        ],
      },
    ],
  },
] as const;

// ── Dropdown panel ────────────────────────────────────────────────────────────

function DropdownPanel({
  groups,
}: {
  groups: readonly { heading: string; items: readonly { label: string; href: string }[] }[];
}) {
  return (
    <div data-keep-dark className="absolute top-full left-1/2 -translate-x-1/2 pt-2 z-50">
      {/* Arrow notch */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-2 overflow-hidden">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#1E1E1E] rotate-45 translate-y-1/2 border-t border-l border-white/10" />
      </div>
      <div className="mt-1.5 bg-[#1E1E1E] rounded-2xl shadow-2xl shadow-black/60 p-5 flex gap-8 min-w-[260px] border border-white/10">
        {groups.map(group => (
          <div key={group.heading} className="flex flex-col min-w-[110px]">
            <p className="text-[9px] font-black uppercase tracking-[0.25em] text-white/30 mb-2.5 pb-1.5 border-b border-white/10">
              {group.heading}
            </p>
            {group.items.map(item => (
              <Link
                key={item.label}
                href={item.href as any}
                className="block text-[13px] font-[500] text-white/60 hover:text-white transition-colors py-1 whitespace-nowrap"
              >
                {item.label}
              </Link>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Desktop nav item ──────────────────────────────────────────────────────────

function DesktopNavItem({ item }: { item: (typeof NAV)[number] }) {
  const [open, setOpen] = useState(false);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  function show() {
    if (timeout.current) clearTimeout(timeout.current);
    setOpen(true);
  }
  function hide() {
    timeout.current = setTimeout(() => setOpen(false), 150);
  }

  return (
    <div className="relative" onMouseEnter={show} onMouseLeave={hide}>
      <Link
        href={item.href as any}
        className={`flex items-center gap-1 whitespace-nowrap text-[12px] font-[500] uppercase tracking-[0.1em] transition-colors duration-150 py-1 ${
          open ? 'text-white' : 'text-white/55 hover:text-white'
        }`}
      >
        {item.label}
        <ChevronDown
          size={10}
          className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </Link>
      {open && <DropdownPanel groups={item.groups} />}
    </div>
  );
}

// ── Mobile accordion item ─────────────────────────────────────────────────────

function MobileNavItem({
  item,
  onClose,
}: {
  item: (typeof NAV)[number];
  onClose: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center justify-between w-full text-xl font-black uppercase tracking-widest text-white"
      >
        {item.label}
        <ChevronDown
          size={18}
          className={`transition-transform duration-200 text-white/40 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="mt-3 pl-4 flex flex-col gap-4 border-l-2 border-white/15">
          {item.groups.map(group => (
            <div key={group.heading}>
              <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">
                {group.heading}
              </p>
              <div className="flex flex-col gap-2">
                {group.items.map(link => (
                  <Link
                    key={link.label}
                    href={link.href as any}
                    onClick={onClose}
                    className="text-base font-[500] text-white/60 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Header ────────────────────────────────────────────────────────────────────

export function Header() {
  const [mobileOpen, setMobileOpen]   = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery]   = useState('');
  const [suggestions, setSuggestions]   = useState<SearchResult[]>([]);
  const [suggOpen, setSuggOpen]         = useState(false);
  const [suggLoading, setSuggLoading]   = useState(false);
  const searchRef  = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();
  const isHome = usePathname() === '/';
  const { user, loading, signInWithGoogle, signOut } = useAuth();

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSuggOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const fetchSuggestions = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.length < 3) { setSuggestions([]); setSuggOpen(false); return; }
    debounceRef.current = setTimeout(async () => {
      setSuggLoading(true);
      try {
        const res  = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setSuggestions(data.results ?? []);
        setSuggOpen(true);
      } finally {
        setSuggLoading(false);
      }
    }, 220);
  }, []);

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setSearchQuery(val);
    fetchSuggestions(val);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    setSuggOpen(false);
    setSearchQuery('');
    router.push(`/reviews?search=${encodeURIComponent(q)}`);
  }

  function handleSuggClick(href: string) {
    setSuggOpen(false);
    setSearchQuery('');
    router.push(href as any);
  }

  return (
    <>
    {isHome && <Masthead />}
    <header className={`sticky top-0 w-full z-50 bg-[var(--shell-bg)] ${isHome ? 'border-y border-[#111]' : ''}`}>
      <div className="max-w-[1140px] mx-auto px-4 sm:px-6 flex items-center justify-between gap-4 xl:gap-8 py-3">

        {/* ── LOGO ─────────────────────────────────────────────── */}
        {!isHome && (
        <Link href="/" className="shrink-0 group flex items-center gap-3">
          {/* YouTube-style play button */}
          <div className="w-9 h-7 bg-[#C8201F] rounded-md flex items-center justify-center shrink-0 group-hover:bg-[#A01818] transition-colors">
            <svg width="11" height="13" viewBox="0 0 11 13" fill="none" aria-hidden>
              <polygon points="1,1 10,6.5 1,12" fill="white" />
            </svg>
          </div>
          {/* Text block */}
          <div className="flex flex-col leading-none">
            <span className="text-[8px] font-[400] uppercase tracking-[0.45em] text-white/30 leading-none mb-[2px] select-none">
              THE
            </span>
            <span className="text-[30px] sm:text-[34px] leading-none tracking-tight text-white" style={{ fontFamily: "Impact, 'Arial Black', sans-serif" }}>
              REEL <span className="text-[#C8201F]">MISFITS</span>
            </span>
            <span className="hidden sm:block text-[7px] font-[500] uppercase tracking-[0.14em] text-white/55 mt-[3px] select-none">
              The Tomatometer is broken. Trust the tube.
            </span>
          </div>
        </Link>
        )}

        {/* ── DESKTOP NAV ──────────────────────────────────────── */}
        <nav className="hidden lg:flex items-center gap-7 xl:gap-10">
          {NAV.map(item => (
            <DesktopNavItem key={item.label} item={item} />
          ))}
        </nav>

        {/* ── SEARCH + AUTH ─────────────────────────────────────── */}
        <div className="flex items-center gap-3 shrink-0 ml-auto">

          {/* Search */}
          <div ref={searchRef} className="relative hidden md:block">
            <form onSubmit={handleSearch} className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none z-10"
                size={13}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => suggestions.length > 0 && setSuggOpen(true)}
                placeholder="Search films & shows…"
                className="bg-white/[0.07] border border-white/[0.10] rounded-full pl-9 pr-4 py-2 text-[13px] w-44 xl:w-56 text-white placeholder:text-white/30 focus:bg-white/[0.10] focus:border-white/20 transition-all outline-none"
              />
            </form>

            {/* Autocomplete dropdown */}
            {suggOpen && (suggestions.length > 0 || suggLoading) && (
              <div data-keep-dark className="absolute top-full left-0 right-0 mt-2 bg-[#1A1A1A] border border-white/10 rounded-xl shadow-2xl shadow-black/60 overflow-hidden z-50 min-w-[300px]">
                {suggLoading && suggestions.length === 0 ? (
                  <div className="px-4 py-3 text-xs text-white/40 font-bold">Searching…</div>
                ) : (
                  <div>
                    {suggestions.map(s => (
                      <button
                        key={`${s.type}-${s.id}`}
                        onClick={() => handleSuggClick(s.href)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/[0.06] transition-colors text-left group"
                      >
                        <div className="shrink-0 w-8 h-12 rounded overflow-hidden bg-white/[0.08]">
                          {s.poster_path ? (
                            <img
                              src={`https://image.tmdb.org/t/p/w92${s.poster_path}`}
                              alt={s.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              {s.type === 'movie'
                                ? <Film size={12} className="text-white/30" />
                                : <Tv   size={12} className="text-white/30" />}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-white truncate">{s.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-white/35">
                              {s.type === 'movie' ? 'Film' : 'TV'}{s.year ? ` · ${s.year}` : ''}
                            </p>
                            {s.hasReviews && (
                              <span className="text-[9px] font-black uppercase tracking-wider text-[#C8201F]">
                                ● Reviews
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                    <button
                      onClick={() => handleSearch({ preventDefault: () => {} } as any)}
                      className="w-full flex items-center gap-2 px-4 py-2.5 border-t border-white/[0.08] text-xs font-bold uppercase tracking-widest text-white/35 hover:text-white hover:bg-white/[0.06] transition-colors"
                    >
                      <Search size={11} />
                      Search for &quot;{searchQuery}&quot;
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Auth */}
          {!loading && (
            user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white overflow-hidden border border-white/15"
                >
                  {user.user_metadata?.avatar_url ? (
                    <img src={user.user_metadata.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User size={16} />
                  )}
                </button>
                {userMenuOpen && (
                  <div data-keep-dark className="absolute right-0 top-12 w-48 bg-[#1A1A1A] rounded-xl shadow-2xl shadow-black/60 border border-white/10 py-2 z-50">
                    <div className="px-4 py-2 border-b border-white/[0.08] mb-1">
                      <p className="text-xs font-bold text-white truncate">
                        {user.user_metadata?.full_name || user.email}
                      </p>
                      <p className="text-[10px] text-white/35 truncate">{user.email}</p>
                    </div>
                    <Link
                      href={'/profile' as any}
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-white/60 hover:bg-white/[0.06] hover:text-white transition-colors"
                    >
                      <User size={14} /> My Profile
                    </Link>
                    <button
                      onClick={() => { signOut(); setUserMenuOpen(false); }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-white/60 hover:bg-white/[0.06] hover:text-white transition-colors"
                    >
                      <LogOut size={14} /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={signInWithGoogle}
                className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/[0.08] border border-white/[0.12] text-[12px] font-bold text-white/70 hover:bg-white/[0.14] hover:text-white transition-all"
              >
                <LogIn size={12} /> Sign In
              </button>
            )
          )}

          {/* Mobile toggle */}
          <button
            className="lg:hidden text-white/60 hover:text-white p-1 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* ── MOBILE MENU ──────────────────────────────────────────── */}
      {mobileOpen && (
        <div className="lg:hidden absolute top-full left-0 w-full bg-[var(--shell-bg)] shadow-xl py-6 px-6 flex flex-col gap-5 z-50 max-h-[80vh] overflow-y-auto">
          {NAV.map(item => (
            <MobileNavItem key={item.label} item={item} onClose={() => setMobileOpen(false)} />
          ))}

          <div className="border-t border-white/[0.08] pt-5 mt-1">
            {user ? (
              <button
                onClick={() => { signOut(); setMobileOpen(false); }}
                className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-white/40"
              >
                <LogOut size={14} /> Sign Out
              </button>
            ) : (
              <button
                onClick={() => { signInWithGoogle(); setMobileOpen(false); }}
                className="flex items-center gap-2 text-sm font-bold text-white/60"
              >
                <LogIn size={14} /> Sign In with Google
              </button>
            )}
          </div>
        </div>
      )}
    </header>
    </>
  );
}
