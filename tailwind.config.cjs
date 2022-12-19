/** @type {import('tailwindcss').Config} */

module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      transitionProperty: {
        image: "height, width",
        background: "background-color, background-image",
      },
    },
  },
  plugins: [],
};
