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
        bg:              '#111111',
        'bg-panel':      '#1A1917',
        'bg-panel-edge': '#2A2825',
        nav:             '#111111',
        surface:         '#1A1A1A',
        'surface-alt':   '#222222',
        'surface-hover': '#2A2A2A',

        // ── Borders ──
        border:          '#2A2A2A',
        'border-hi':     '#3A3A3A',

        // ── Text ──
        ink:      '#E8E4DC',
        'ink-loud':  '#FFFFFF',
        'ink-muted': '#8F8A82',
        body:     '#D4D4D4',
        subtle:   '#737373',
        faint:    '#4A4A4A',

        // ── Brand red ──
        red: {
          DEFAULT: '#C8201F',
          deep:    '#8E1414',
          dark:    '#7A110F',
          soft:    '#2D0808',
        },

        // ── Score colours ──
        green: {
          DEFAULT: '#2FBF5A',
          soft:    '#0F2A1A',
        },
        gold: {
          DEFAULT: '#E0A22B',
          soft:    '#2A1A08',
        },
        amber: {
          DEFAULT: '#E0A22B',
        },

        // ── Utility ──
        blue: {
          DEFAULT: '#065FD4',
          soft:    '#071A3A',
        },
      },

      fontFamily: {
        sans:      ['var(--font-geist-sans)', 'system-ui', '-apple-system', 'sans-serif'],
        mono:      ['var(--font-geist-mono)', 'ui-monospace', 'monospace'],
        display:   ['var(--font-display)', 'Impact', 'Arial Black', 'sans-serif'],
        editorial: ['var(--font-editorial)', 'Georgia', 'serif'],
        stencil:   ['var(--font-display)', 'Impact', 'Arial Narrow', 'sans-serif'],
      },

      letterSpacing: {
        'display-sm': '-0.015em',
        'display-md': '-0.025em',
        'display-lg': '-0.03em',
        'display-xl': '-0.04em',
      },

      borderRadius: {
        card: '0px',
      },

      boxShadow: {
        'hard':    '3px 3px 0 0 #C8201F',
        'hard-lg': '5px 5px 0 0 #C8201F',
        'inverse': '3px 3px 0 0 #FFFFFF',
        card:         '3px 3px 0 0 #C8201F',
        'card-hover': '5px 5px 0 0 #C8201F',
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
