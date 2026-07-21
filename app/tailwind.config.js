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
          surface: token('primary-surface'),
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
        danger: {
          DEFAULT: token('danger'),
          surface: token('danger-surface'),
        },
        success: token('success'),
        warning: token('warning'),
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '16px',
      },
      fontSize: {
        display: ['30px', { lineHeight: '36px' }],
        title: ['22px', { lineHeight: '28px' }],
        headline: ['17px', { lineHeight: '22px' }],
        body: ['16px', { lineHeight: '22px' }],
        callout: ['15px', { lineHeight: '20px' }],
        caption: ['13px', { lineHeight: '18px' }],
      },
    },
  },
  plugins: [],
};
