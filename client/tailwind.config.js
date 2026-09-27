/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        charcoal: '#141414',
        darkBrown: '#24150F',
        warmOrange: '#D97735',
        gold: '#E5A84B',
        cream: '#FFF4E5',
        successGreen: '#2E9B62',
        warningAmber: '#E5A84B',
        errorRed: '#D9534F',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        kanit: ['Kanit', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
