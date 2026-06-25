/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        holiday: {
          national: '#10b981',
          state: '#3b82f6',
          municipal: '#a855f7',
          optional: '#f59e0b',
          state_optional: '#fb923c',
          commemorative: '#ec4899',
        },
        surface: {
          light: '#ffffff',
          dark: '#111111',
        },
        background: {
          light: '#fafafa',
          dark: '#0a0a0a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
