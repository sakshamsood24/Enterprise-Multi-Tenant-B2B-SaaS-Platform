import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#101828",
        cloud: "#f4f7fb",
        brand: "#2563eb"
      }
    }
  },
  plugins: []
};

export default config;
