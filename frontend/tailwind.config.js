/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        charcoal: {
          950: '#0c0c0e',
          900: '#141418',
          850: '#1a1a20',
          800: '#22222a',
          750: '#2c2c36',
          700: '#383844',
          600: '#4e4e5e',
        },
        cream: {
          50: '#fffef9',
          100: '#faf6eb',
          200: '#f3eed9',
          300: '#e5dcbf',
          400: '#cfc29b',
        },
        brand: {
          orange: '#f97316',
          'orange-dark': '#ea580c',
          'orange-light': '#fb923c',
          gold: '#eab308',
          'gold-light': '#facc15',
          'gold-dark': '#ca8a04',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
