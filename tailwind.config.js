/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,vue}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        peach: {
          50: '#fff5f3',
          100: '#ffe8e4',
          200: '#ffd0c7',
          300: '#ffb0a0',
          400: '#ff8a80',
          500: '#ff6b6b',
          600: '#e84545',
        },
        mint: {
          50: '#f0faf2',
          100: '#dcf5e2',
          200: '#b8eac5',
          300: '#a5d6a7',
          400: '#81c784',
          500: '#66bb6a',
        },
        cream: {
          50: '#fffdf9',
          100: '#fff8f0',
          200: '#fff0e0',
          300: '#ffe4c8',
        },
        warm: {
          50: '#faf5f2',
          100: '#f0e6df',
          200: '#e0ccc2',
          300: '#c9a99a',
          400: '#8d6e63',
          500: '#4e342e',
        },
      },
      fontFamily: {
        display: ['Nunito', 'system-ui', 'sans-serif'],
        body: ['system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
