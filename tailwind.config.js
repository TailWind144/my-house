/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      gridTemplateColumns: {
        normal: 'repeat(3, minmax(200px, 1fr))'
      }
    }
  },
  plugins: []
}
