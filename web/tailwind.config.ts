import type { Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme";
import animatePlugin from "tailwindcss-animate";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'Inter'", ...defaultTheme.fontFamily.sans],
      },
      colors: {
        "glass-foreground": "rgba(255, 255, 255, 0.92)",
        "glass-border": "rgba(255, 255, 255, 0.16)",
        "glass-muted": "rgba(255, 255, 255, 0.6)",
        "glass-accent": "rgba(93, 208, 255, 0.85)",
      },
      backgroundImage: {
        "dream-gradient": "radial-gradient(circle at 20% 20%, rgba(93, 208, 255, 0.18), transparent 50%), radial-gradient(circle at 80% 30%, rgba(164, 108, 254, 0.2), transparent 45%)",
      },
      boxShadow: {
        "glass-layer": "inset 0 1px 0 rgba(255,255,255,0.2), inset 0 0 40px rgba(142,196,255,0.08)",
      },
    },
  },
  plugins: [animatePlugin],
};

export default config;
