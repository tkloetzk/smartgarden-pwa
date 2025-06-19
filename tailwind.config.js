// tailwind.config.js (Update your existing config)
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Your existing garden colors
        garden: {
          50: "#f0f9f4",
          100: "#dcf2e4",
          200: "#bce5cd",
          300: "#8dd0aa",
          400: "#57b380",
          500: "#349960",
          600: "#2F6F4E", // Your primary color
          700: "#1e5a3a",
          800: "#1a4a31",
          900: "#163d29",
        },
        // Add emerald for the buttons (it's usually included in Tailwind but making sure)
        primary: {
          light: "#4CAF76",
          DEFAULT: "#2F6F4E",
          dark: "#234E3A",
        },
        accent: "#D69E2E",
        success: "#38A169",
        warning: "#DD6B20",
        error: "#E53E3E",
      },
      boxShadow: {
        sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
        lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
      },
    },
  },
  darkMode: "class",
  plugins: [],
};
