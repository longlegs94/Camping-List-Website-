import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0faf4",
          100: "#dcf4e5",
          200: "#bce8ce",
          300: "#8ed6ac",
          400: "#57bd83",
          500: "#34a165",
          600: "#248350",
          700: "#1e6842",
          800: "#1b5337",
          900: "#17442f",
        },
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
      },
    },
  },
  plugins: [],
};

export default config;
