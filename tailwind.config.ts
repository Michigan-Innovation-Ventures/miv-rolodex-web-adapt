import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "var(--paper)",
        card: "var(--card)",
        ink: "var(--ink)",
        muted: "var(--muted)",
        line: "var(--line)",
        oxblood: "var(--oxblood)",
        "oxblood-deep": "var(--oxblood-deep)",
        moss: "var(--moss)",
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        sans: ["var(--font-sans)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(28,35,33,.06), 0 8px 24px -12px rgba(28,35,33,.14)",
        lift: "0 2px 4px rgba(28,35,33,.08), 0 16px 40px -16px rgba(28,35,33,.22)",
      },
    },
  },
  plugins: [],
};
export default config;
