import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#171717",
          50: "#fafafa",
          100: "#f5f5f5",
          200: "#e5e5e5",
          300: "#d4d4d4",
          400: "#a3a3a3",
          500: "#737373",
          600: "#525252",
          700: "#404040",
          800: "#262626",
          900: "#171717",
          950: "#0a0a0a",
        },
        accent: {
          DEFAULT: "#c8a415",
          50: "#fefce8",
          100: "#fef9c3",
          200: "#fef08a",
          300: "#fde047",
          400: "#c8a415",
          500: "#a16207",
          600: "#854d0e",
        },
        success: { DEFAULT: "#16a34a", light: "#dcfce7" },
        error: { DEFAULT: "#dc2626", light: "#fee2e2" },
        warning: { DEFAULT: "#d97706", light: "#fef3c7" },
        surface: { DEFAULT: "#ffffff", secondary: "#fafafa", tertiary: "#f5f5f5" },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      fontSize: {
        "display-xl": ["3.5rem", { lineHeight: "1.1", letterSpacing: "0", fontWeight: "700" }],
        "display-lg": ["2.75rem", { lineHeight: "1.15", letterSpacing: "0", fontWeight: "700" }],
        "display-md": ["2rem", { lineHeight: "1.2", letterSpacing: "0", fontWeight: "600" }],
        "heading-lg": ["1.5rem", { lineHeight: "1.3", fontWeight: "600" }],
        "heading-md": ["1.25rem", { lineHeight: "1.4", fontWeight: "600" }],
        "heading-sm": ["1.125rem", { lineHeight: "1.4", fontWeight: "600" }],
        "body-lg": ["1.125rem", { lineHeight: "1.6" }],
        "body-md": ["1rem", { lineHeight: "1.6" }],
        "body-sm": ["0.875rem", { lineHeight: "1.5" }],
        caption: ["0.75rem", { lineHeight: "1.4", letterSpacing: "0.02em" }],
        overline: ["0.75rem", { lineHeight: "1.4", letterSpacing: "0.08em", fontWeight: "600" }],
      },
      spacing: {
        "section-y": "5rem",
        "section-y-sm": "3rem",
        "container-x": "1.5rem",
        "card-p": "1.5rem",
        "card-p-sm": "1rem",
      },
      maxWidth: {
        content: "1280px",
        narrow: "768px",
        wide: "1440px",
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)",
        "card-hover": "0 10px 25px rgba(0,0,0,0.08), 0 4px 10px rgba(0,0,0,0.04)",
        elevated: "0 20px 40px rgba(0,0,0,0.1)",
        inner: "inset 0 1px 2px rgba(0,0,0,0.06)",
      },
      borderRadius: {
        card: "0.75rem",
        button: "0.5rem",
        input: "0.5rem",
        badge: "9999px",
      },
      transitionTimingFunction: {
        luxury: "cubic-bezier(0.2, 0.8, 0.2, 1)",
      },
      keyframes: {
        slideDown: {
          from: { opacity: "0", transform: "translateY(-8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        slideDown: "slideDown 200ms ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
