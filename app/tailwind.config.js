/** @type {import('tailwindcss').Config} */
const token = (name) => `rgb(var(--color-${name}) / <alpha-value>)`;

module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: token('primary'),
          pressed: token('primary-pressed'),
        },
        'on-primary': token('on-primary'),
        surface: {
          DEFAULT: token('surface'),
          elevated: token('surface-elevated'),
          sunken: token('surface-sunken'),
        },
        border: token('border'),
        text: {
          DEFAULT: token('text'),
          secondary: token('text-secondary'),
          tertiary: token('text-tertiary'),
        },
        // Même rouge que status-late — sémantique différente (erreur/destructif vs échéance dépassée).
        danger: {
          DEFAULT: token('status-late'),
          surface: token('danger-surface'),
        },
        status: {
          ok: token('status-ok'),
          soon: token('status-soon'),
          late: token('status-late'),
        },
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '16px',
      },
      fontSize: {
        display: ['32px', { lineHeight: '38px', letterSpacing: '-0.6px' }],
        title: ['22px', { lineHeight: '28px' }],
        headline: ['17px', { lineHeight: '22px' }],
        body: ['15px', { lineHeight: '20px' }],
        caption: ['13px', { lineHeight: '16px' }],
        eyebrow: ['11px', { lineHeight: '14px', letterSpacing: '0.8px' }],
      },
    },
  },
  plugins: [],
};
