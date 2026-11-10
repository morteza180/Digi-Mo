/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './lib/**/*.{js,jsx}',
  ],
  theme: {
    container: { center: true, padding: '1rem', screens: { '2xl': '1280px' } },
    extend: {
      colors: {
        lajevard: { DEFAULT: '#1f3a6e', dark: '#142750', light: '#e8eef9' },
        firouzeh: { DEFAULT: '#2bb3a3', dark: '#1f8c7f' },
        zaferan: '#f5a623',
        anar: '#c0392b',
      },
      fontFamily: { sans: ['var(--font-vazir)', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
};