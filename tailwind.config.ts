import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      screens: {
        // Devices with a real hover (mouse/trackpad). Use for hide-until-hover
        // controls so they stay visible on touchscreens.
        "can-hover": { raw: "(hover: hover)" },
      },
      fontFamily: {
        // `font-geist-mono` — labels, badges, counts, dates (spec §7)
        "geist-mono": ["var(--font-geist-mono)", "ui-monospace", "monospace"],
        "geist-sans": ["var(--font-geist-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // NYX design tokens (spec §7)
        nyx: {
          bg: "#0B0817",
          card: "#161229",
          "card-alt": "#13102A",
          menu: "#1E1838",
          border: "#2C2650",
          violet: "#8B6FFF",
          "violet-dark": "#6a4ee0",
          gold: "#F4D58D",
          mint: "#6EE7B7",
          coral: "#FF8A65",
          text: "#ECE7FF",
          muted: "#8A82B0",
        },
      },
    },
  },
  plugins: [],
};
export default config;
