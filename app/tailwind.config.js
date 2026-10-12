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
        brand: {
          DEFAULT: token('brand'),
          pressed: token('brand-pressed'),
        },
        'on-brand': token('on-brand'),
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
        danger: {
          DEFAULT: token('status-late'),
          surface: token('danger-surface'),
        },
        status: {
          ok: token('status-ok'),
          soon: token('status-soon'),
          late: token('status-late'),
        },
        // Pastilles par type d'entrée : `bg-type-vaccine` + `text-type-vaccine-fg`.
        type: {
          vaccine: token('type-vaccine'),
          'vaccine-fg': token('type-vaccine-fg'),
          treatment: token('type-treatment'),
          'treatment-fg': token('type-treatment-fg'),
          visit: token('type-visit'),
          'visit-fg': token('type-visit-fg'),
          weight: token('type-weight'),
          'weight-fg': token('type-weight-fg'),
        },
      },
      borderRadius: {
        sm: '6px',
        md: '12px',
        lg: '14px',
        xl: '24px',
      },
      fontSize: {
        hero: ['46px', { lineHeight: '50px', letterSpacing: '-1.6px' }],
        display: ['32px', { lineHeight: '36px', letterSpacing: '-0.8px' }],
        title: ['22px', { lineHeight: '28px' }],
        headline: ['17px', { lineHeight: '22px' }],
        body: ['16px', { lineHeight: '22px' }],
        caption: ['13px', { lineHeight: '17px' }],
        eyebrow: ['11px', { lineHeight: '14px', letterSpacing: '0.8px' }],
      },
    },
  },
  plugins: [],
};
