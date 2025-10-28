/** @type {import('tailwindcss').Config} */
// const animate = require("tailwindcss-animate");
import animate from "tailwindcss-animate"
module.exports = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./pages/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [animate],
};
