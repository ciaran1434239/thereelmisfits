import Link from 'next/link';

const BROWSE_LINKS = [
  { label: 'Films',      href: '/reviews?type=movie' },
  { label: 'Box Office', href: '/box-office' },
  { label: 'Channels',   href: '/channels' },
];

const RANKED_LINKS = [
  { label: 'The Lists',   href: '/ranked/lists' },
  { label: 'Polls',       href: '/ranked/polls' },
  { label: 'Leaderboard', href: '/critics/league' },
  { label: 'Box Office',  href: '/box-office' },
];

const COMPANY_LINKS = [
  { label: 'About Us',         href: '/about' },
  { label: 'Submit a Channel', href: '/submit' },
  { label: 'Privacy Policy',   href: '/privacy' },
  { label: 'Contact',          href: '/contact' },
];

export function Footer() {
  return (
    <footer
      className="bg-[#1A1A1A] text-white"
      style={{ borderTop: '3px solid #C8201F' }}
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10">

        {/* Top: logo + tagline + submit CTA */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-8 mb-8">
          <div className="flex flex-col leading-none">
            <span className="text-[9px] font-[400] uppercase tracking-[0.4em] text-white/40 leading-none mb-0.5">THE</span>
            <div className="font-stencil text-[24px] leading-none tracking-wide">
              <span className="text-white">REEL&nbsp;</span>
              <span className="text-[#C8201F]">MISFITS</span>
            </div>
            <p className="text-[10px] font-bold text-white/30 mt-1.5 uppercase tracking-[0.15em]">
              YouTube film criticism, aggregated
            </p>
          </div>

          <Link
            href={"/submit" as any}
            className="self-start sm:self-auto inline-flex items-center gap-2 bg-[#C8201F] text-white px-5 py-2.5 rounded text-[11px] font-black uppercase tracking-widest hover:bg-[#A01818] transition-colors"
          >
            + Submit a Channel
          </Link>
        </div>

        {/* Nav columns */}
        <div className="mb-8 pb-8 border-b border-white/[0.06]">

          {/* Mobile: 2-col grid */}
          <div className="grid grid-cols-2 gap-8 sm:hidden">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/25 mb-3">Browse</p>
              <nav className="flex flex-col gap-2">
                {BROWSE_LINKS.map(({ label, href }) => (
                  <Link key={href} href={href as any} className="text-[12px] font-semibold text-white/45 hover:text-white transition-colors">{label}</Link>
                ))}
              </nav>
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/25 mb-3">Ranked</p>
              <nav className="flex flex-col gap-2">
                {RANKED_LINKS.map(({ label, href }) => (
                  <Link key={href} href={href as any} className="text-[12px] font-semibold text-white/45 hover:text-white transition-colors">{label}</Link>
                ))}
              </nav>
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/25 mb-3">Company</p>
              <nav className="flex flex-col gap-2">
                {COMPANY_LINKS.map(({ label, href }) => (
                  <Link key={href} href={href as any} className="text-[12px] font-semibold text-white/45 hover:text-white transition-colors">{label}</Link>
                ))}
              </nav>
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/25 mb-3">Follow</p>
              <div className="flex flex-col gap-2">
                {[
                  { label: 'YouTube', href: 'https://youtube.com' },
                  { label: 'Twitter / X', href: 'https://x.com' },
                  { label: 'Instagram', href: 'https://instagram.com' },
                ].map(({ label, href }) => (
                  <a key={label} href={href} target="_blank" rel="noopener noreferrer" className="text-[12px] font-semibold text-white/45 hover:text-white transition-colors">{label}</a>
                ))}
              </div>
            </div>
          </div>

          {/* Desktop: flex — Browse+Ranked tight together, Company next, Follow far right */}
          <div className="hidden sm:flex items-start gap-12">

            {/* Browse + Ranked grouped tightly */}
            <div className="flex gap-8">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/25 mb-3">Browse</p>
                <nav className="flex flex-col gap-2">
                  {BROWSE_LINKS.map(({ label, href }) => (
                    <Link key={href} href={href as any} className="text-[12px] font-semibold text-white/45 hover:text-white transition-colors">{label}</Link>
                  ))}
                </nav>
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/25 mb-3">Ranked</p>
                <nav className="flex flex-col gap-2">
                  {RANKED_LINKS.map(({ label, href }) => (
                    <Link key={href} href={href as any} className="text-[12px] font-semibold text-white/45 hover:text-white transition-colors">{label}</Link>
                  ))}
                </nav>
              </div>
            </div>

            {/* Company */}
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/25 mb-3">Company</p>
              <nav className="flex flex-col gap-2">
                {COMPANY_LINKS.map(({ label, href }) => (
                  <Link key={href} href={href as any} className="text-[12px] font-semibold text-white/45 hover:text-white transition-colors">{label}</Link>
                ))}
              </nav>
            </div>

            {/* Follow — pushed to the far right */}
            <div className="ml-auto">
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/25 mb-3">Follow</p>
              <div className="flex flex-col gap-2">
                {[
                  { label: 'YouTube', href: 'https://youtube.com' },
                  { label: 'Twitter / X', href: 'https://x.com' },
                  { label: 'Instagram', href: 'https://instagram.com' },
                ].map(({ label, href }) => (
                  <a key={label} href={href} target="_blank" rel="noopener noreferrer" className="text-[12px] font-semibold text-white/45 hover:text-white transition-colors">{label}</a>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Bottom */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">
            © 2026 THE REEL MISFITS · ALL RIGHTS RESERVED
          </p>
          <p className="text-[10px] text-white/15 italic">
            The Tomatometer is broken. Trust the Tube.
          </p>
        </div>

      </div>
    </footer>
  );
}
