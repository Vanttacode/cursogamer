/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "Menlo", "monospace"],
      },
      colors: {
        "jules-bg": "#09090b",
        "jules-panel": "#121214",
        "jules-border": "#27272a",
        "jules-primary": "#e4e4e7",
        "jules-secondary": "#a1a1aa",
        "jules-accent": "#3b82f6",
      },
      animation: {
        "spin-slow": "spin 12s linear infinite",
      },
    },
  },
  plugins: [],
};
