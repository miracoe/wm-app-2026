/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#0a0a1a',
          card: '#12122a',
          gold: '#f5c518',
          red: '#e63946',
          green: '#2dc653',
          blue: '#4361ee',
        },
      },
      fontFamily: {
        display: ['Impact', 'Arial Black', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
