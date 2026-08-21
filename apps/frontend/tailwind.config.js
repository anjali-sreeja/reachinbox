/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "#08090E",
        surface: {
          DEFAULT: "#10121A",
          subtle: "#141724",
          elevated: "#181B2B",
          border: "rgba(255, 255, 255, 0.07)",
          borderHover: "rgba(99, 102, 241, 0.35)",
        },
        brand: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
          purple: "#8b5cf6",
          cyan: "#06b6d4",
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "ai-gradient": "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #d946ef 100%)",
        "ai-glow": "radial-gradient(circle at 50% -20%, rgba(99, 102, 241, 0.18) 0%, rgba(139, 92, 246, 0.05) 50%, transparent 80%)",
        "card-glass": "linear-gradient(180deg, rgba(20, 23, 36, 0.75) 0%, rgba(16, 18, 26, 0.9) 100%)",
      },
      boxShadow: {
        "glow-sm": "0 0 15px -3px rgba(99, 102, 241, 0.2)",
        "glow-md": "0 0 25px -5px rgba(99, 102, 241, 0.3)",
        "glow-lg": "0 0 40px -10px rgba(139, 92, 246, 0.35)",
        "inner-glow": "inset 0 1px 1px 0 rgba(255, 255, 255, 0.08)",
      },
      animation: {
        "pulse-subtle": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
