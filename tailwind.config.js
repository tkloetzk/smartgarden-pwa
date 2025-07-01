// tailwind.config.js
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Your existing color system...
        background: "rgb(var(--background) / <alpha-value>)",
        foreground: "rgb(var(--foreground) / <alpha-value>)",
        card: {
          DEFAULT: "rgb(var(--card) / <alpha-value>)",
          foreground: "rgb(var(--card-foreground) / <alpha-value>)",
        },
        primary: {
          DEFAULT: "rgb(var(--primary) / <alpha-value>)",
          foreground: "rgb(var(--primary-foreground) / <alpha-value>)",
        },
        secondary: {
          DEFAULT: "rgb(var(--secondary) / <alpha-value>)",
          foreground: "rgb(var(--secondary-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "rgb(var(--muted) / <alpha-value>)",
          foreground: "rgb(var(--muted-foreground) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "rgb(var(--accent) / <alpha-value>)",
          foreground: "rgb(var(--accent-foreground) / <alpha-value>)",
        },
        border: "rgb(var(--border) / <alpha-value>)",
        ring: "rgb(var(--ring) / <alpha-value>)",
        input: {
          DEFAULT: "rgb(var(--input) / <alpha-value>)",
          foreground: "rgb(var(--input-foreground) / <alpha-value>)",
        },
        // Keep your garden colors...
        garden: {
          50: "#f0f9f4",
          100: "#dcf2e4",
          200: "#bce5cd",
          300: "#8dd0aa",
          400: "#57b380",
          500: "#349960",
          600: "#2F6F4E",
          700: "#1e5a3a",
          800: "#1a4a31",
          900: "#163d29",
        },
        success: "#38A169",
        warning: "#DD6B20",
        error: "#E53E3E",
      },
      spacing: {
        "safe-bottom": "env(safe-area-inset-bottom)",
      },
      minWidth: {
        touch: "44px", // Minimum touch target
      },
      minHeight: {
        touch: "44px", // Minimum touch target
      },
    },
  },
  darkMode: "class",
  plugins: [],
};
