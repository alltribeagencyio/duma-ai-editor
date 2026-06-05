import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        duma: {
          primary: "#ad00ab",
          secondary: "#6900f5",
          "primary-light": "#c933c7",
          "primary-dark": "#8a0089",
          "secondary-light": "#8533f7",
          "secondary-dark": "#5200c4",
        },
        glass: {
          DEFAULT: "rgba(255,255,255,0.6)",
          strong: "rgba(255,255,255,0.8)",
          border: "rgba(255,255,255,0.6)",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sans)", "sans-serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        "2xl": "1.25rem",
        "3xl": "1.75rem",
      },
      boxShadow: {
        glass:
          "0 8px 32px -8px rgba(76, 0, 130, 0.18), inset 0 1px 0 rgba(255,255,255,0.6)",
        "glass-sm":
          "0 4px 18px -6px rgba(76, 0, 130, 0.14), inset 0 1px 0 rgba(255,255,255,0.55)",
        "glass-lg":
          "0 24px 60px -18px rgba(76, 0, 130, 0.28), inset 0 1px 0 rgba(255,255,255,0.65)",
        glow: "0 10px 30px -8px rgba(173, 0, 171, 0.45)",
        "glow-lg": "0 18px 48px -10px rgba(105, 0, 245, 0.5)",
      },
      backdropBlur: {
        xs: "2px",
      },
      backgroundImage: {
        "brand-gradient":
          "linear-gradient(135deg, #ad00ab 0%, #8a3df6 55%, #6900f5 100%)",
        "aurora":
          "radial-gradient(42rem 42rem at 8% -6%, rgba(173,0,171,0.16), transparent 60%), radial-gradient(40rem 40rem at 100% 0%, rgba(105,0,245,0.16), transparent 58%)",
      },
      keyframes: {
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(173,0,171,0.25)" },
          "50%": { boxShadow: "0 0 24px 4px rgba(173,0,171,0.25)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
      animation: {
        "fade-in-up": "fade-in-up 0.5s cubic-bezier(0.22,1,0.36,1) both",
        "fade-in": "fade-in 0.4s ease-out both",
        shimmer: "shimmer 2s infinite",
        "glow-pulse": "glow-pulse 2.4s ease-in-out infinite",
        float: "float 5s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
