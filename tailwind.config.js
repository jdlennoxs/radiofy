/** @type {import('tailwindcss').Config} */

module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
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
      },
      transitionProperty: {
        image: "height, width",
        background: "background-color, background-image",
      },
    },
  },
  plugins: [],
};
