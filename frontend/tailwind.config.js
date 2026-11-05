/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: { 50: '#f1f5fb', 100: '#dde6f4', 200: '#b9c9e6', 300: '#8aa4d2', 400: '#5b7fba', 500: '#3b619f', 600: '#2d4c80', 700: '#233b66', 800: '#182a4d', 900: '#101e3a', 950: '#0a1428' },
        coral: { 50: '#fff1f1', 100: '#ffe0e0', 400: '#fb7185', 500: '#f4586b', 600: '#e03a52', 700: '#bb2a40' },
      },
      fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'] },
    },
  },
  plugins: [],
};
