/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}"
  ],
  theme: {
    extend: {
      colors: {
        primary: "#b30000", //red
        dark: "#121212",      // black
        light: "#f5f5f5",    //light
      },
    },
  },
  plugins: [],
};