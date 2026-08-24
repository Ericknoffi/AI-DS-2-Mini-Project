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
        background: "#0b1326",
        surface: "#0b1326",
        primary: "#4cd7f6",
        secondary: "#d0bcff",
        tertiary: "#4edea3",
        error: "#ffb4ab",
      }
    },
  },
  plugins: [],
}
