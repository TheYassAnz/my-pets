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
    },
  },
  plugins: [],
};
