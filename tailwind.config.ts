import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        marca: { DEFAULT: "#4f46e5", esc: "#4338ca", clara: "#eef2ff" },
        tinta: { DEFAULT: "#0f172a", suave: "#64748b" },
        verde: { DEFAULT: "#10b981", esc: "#059669" },
        zap: "#25d366",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Fraunces", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};
export default config;
