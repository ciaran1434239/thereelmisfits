// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // ── Page backgrounds ──
        bg:              '#0D0D0D',   // near-black main page
        nav:             '#111111',   // nav bar
        surface:         '#1A1A1A',   // card / raised surface
        'surface-alt':   '#222222',   // hover state for surface
        'surface-hover': '#2A2A2A',   // deeper hover

        // ── Borders ──
        border:          '#2A2A2A',
        'border-hi':     '#3A3A3A',

        // ── Text ──
        ink:    '#F5F5F5',   // primary — near-white headings
        body:   '#D4D4D4',   // body copy
        subtle: '#737373',   // secondary labels
        faint:  '#4A4A4A',   // placeholders, timestamps

        // ── Brand red ──
        red: {
          DEFAULT: '#C8201F',
          deep:    '#A11816',
          dark:    '#7A110F',
          soft:    '#2D0808',
        },

        // ── Score colours ──
        green: {
          DEFAULT: '#4ADE80',
          soft:    '#0F2A1A',
        },
        gold: {
          DEFAULT: '#D97706',
          soft:    '#2A1A08',
        },

        // ── Utility ──
        blue: {
          DEFAULT: '#065FD4',
          soft:    '#071A3A',
        },
      },

      fontFamily: {
        sans:    ['var(--font-geist-sans)', 'system-ui', '-apple-system', 'sans-serif'],
        mono:    ['var(--font-geist-mono)', 'ui-monospace', 'monospace'],
        display: ['var(--font-display)', 'Impact', 'Arial Black', 'sans-serif'],
        stencil: ['var(--font-display)', 'Impact', 'Arial Narrow', 'sans-serif'],
      },

      letterSpacing: {
        'display-sm': '-0.015em',
        'display-md': '-0.025em',
        'display-lg': '-0.03em',
        'display-xl': '-0.04em',
      },

      borderRadius: {
        card: '6px',
      },

      boxShadow: {
        card:         '0 2px 12px rgba(0,0,0,0.5)',
        'card-hover': '0 12px 32px rgba(0,0,0,0.7)',
      },

      keyframes: {
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.4' },
        },
        'float-up': {
          '0%':   { transform: 'translate(-50%,-50%) scale(1)',    opacity: '1' },
          '60%':  { transform: 'translate(-50%,-80px) scale(1.4)', opacity: '0.7' },
          '100%': { transform: 'translate(-50%,-120px) scale(0.8)', opacity: '0' },
        },
      },

      animation: {
        pulse:      'pulse 1.6s ease-in-out infinite',
        'float-up': 'float-up 600ms ease-out forwards',
      },
    },
  },
  plugins: [],
};

export default config;
