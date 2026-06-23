import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        persian: ["Vazirmatn", "Tahoma", "Arial", "sans-serif"],
      },
      colors: {
        primary: {
          50: "#f0f7ff",
          100: "#e0efff",
          200: "#b9dcfe",
          300: "#7cc0fd",
          400: "#379ffa",
          500: "#0d82eb",
          600: "#0264c9",
          700: "#0350a3",
          800: "#074487",
          900: "#0c3a70",
        },
      },
    },
  },
  plugins: [],
};

export default config;
