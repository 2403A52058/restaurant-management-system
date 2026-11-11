/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        green: {
          50:  '#e8f5ef',
          100: '#c3e6d4',
          200: '#9bd6b7',
          300: '#70c699',
          400: '#4fb97f',
          500: '#2d6a4f',
          600: '#285f47',
          700: '#21523d',
          800: '#1a4432',
          900: '#103325',
        },
        gold: {
          DEFAULT: '#d4a017',
          light: '#f0c040',
          dark: '#a07010',
        },
        cream: {
          DEFAULT: '#fefae0',
          dark: '#f5f0d0',
        },
        brown: {
          DEFAULT: '#6b4c11',
          light: '#8b6914',
          dark: '#4a3008',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
