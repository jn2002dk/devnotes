import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#f6f1e8",
        ink: "#172121",
        accent: "#fb923c",
        signal: "#1f6f78",
        plum: "#7c3a66",
        moss: "#6f7d38"
      },
      boxShadow: {
        card: "0 18px 40px rgba(23, 33, 33, 0.12)",
        panel: "0 10px 30px rgba(23, 33, 33, 0.08)"
      },
      backgroundImage: {
        grain: "radial-gradient(circle at 1px 1px, rgba(23, 33, 33, 0.08) 1px, transparent 0)"
      }
    }
  },
  plugins: []
};

export default config;