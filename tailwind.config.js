const defaultTheme = require("tailwindcss/defaultTheme");

/** @type {import('tailwindcss').Config} */

module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", ...defaultTheme.fontFamily.sans],
        display: ["var(--font-display)", ...defaultTheme.fontFamily.serif],
      },
      colors: {
        // Warm off-white paper tones.
        cream: {
          50: "#FDFBF5",
          100: "#F8F3E7",
          200: "#F1E8D5",
          300: "#E6D9BF",
          400: "#D5C4A1",
        },
        // Deep forest green.
        forest: {
          50: "#F0F5F1",
          100: "#DDE8E0",
          200: "#B9CFC0",
          300: "#8FB39A",
          400: "#5E9270",
          500: "#3F7D57",
          600: "#2F6344",
          700: "#274F38",
          800: "#1E3C2A",
          900: "#142A1D",
        },
        // Half-saturation forest, for soft background washes.
        sage: {
          50: "#F4F7F5",
          100: "#E6ECE8",
          200: "#CDD8D0",
          300: "#A9BCAE",
          400: "#7E9884",
          500: "#5A7A62",
          600: "#3C5646",
          700: "#32483A",
          800: "#283A2F",
          900: "#1B281F",
        },
      },
      transitionProperty: {
        image: "height, width",
        background: "background-color, background-image",
      },
    },
  },
  plugins: [],
};
