/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e6f7f7',
          100: '#b3e6e6',
          200: '#80d4d4',
          300: '#4dc3c3',
          400: '#1ab1b1',
          500: '#00989B',
          600: '#007d7f',
          700: '#006163',
          800: '#004648',
          900: '#002b2c',
        },
        accent: {
          50: '#fff5eb',
          100: '#ffe0c2',
          200: '#ffcc99',
          300: '#ffb770',
          400: '#ffa347',
          500: '#FF8E1E',
          600: '#e67200',
          700: '#b35800',
          800: '#803e00',
          900: '#4d2500',
        },
      },
      fontFamily: {
        display: ['Plus Jakarta Sans', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
