/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-primary': '#0f0f1a',
        'bg-secondary': '#1a1a2e',
        'bg-card': '#16213e',
        'border-color': '#2d2d44',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'], // Можно добавить шрифт Inter через Google Fonts
      }
    },
  },
  plugins: [],
}