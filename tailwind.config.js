/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        display: ['"Fraunces"', 'Georgia', 'serif'],
      },
      colors: {
        brand: {
          50: '#effaf4', 100: '#d8f3e3', 200: '#b3e6ca', 300: '#80d2a9', 400: '#4bb784',
          500: '#289b68', 600: '#1a7d53', 700: '#166445', 800: '#145039', 900: '#114230',
        },
        peach: { 50: '#fff6ef', 100: '#ffe9d8', 400: '#fb9a5b', 500: '#f47b35' },
        ink: '#10231b',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(16,35,27,.04), 0 8px 24px -12px rgba(16,35,27,.12)',
      },
    },
  },
  plugins: [],
};
