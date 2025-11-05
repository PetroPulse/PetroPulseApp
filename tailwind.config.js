
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          900: "#0B1F3B",
          700: "#1F3A5F",
          500: "#1E66F5",
          400: "#00C2D1",
          300: "#60DBE8",
          accent: "#F59E0B"
        }
      },
      borderRadius: { '2xl': "16px" }
    },
  },
  plugins: [],
};
