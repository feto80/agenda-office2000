/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // 👈 ¡Esta línea es la clave!
  content: ["./public/index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
}
