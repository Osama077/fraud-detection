/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#EFF6FF", 100: "#DBEAFE", 200: "#BFDBFE",
          500: "#3B82F6", 600: "#2563EB", 700: "#1D4ED8",
          900: "#1E3A5F",
        },
        fraud:  { DEFAULT: "#EF4444", light: "#FEE2E2" },
        safe:   { DEFAULT: "#22C55E", light: "#DCFCE7" },
        warn:   { DEFAULT: "#F59E0B", light: "#FEF3C7" },
      },
      fontFamily: { sans: ["Inter", "system-ui", "sans-serif"] },
    },
  },
  plugins: [],
};
