/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        game: ['"Press Start 2P"', '"VT323"', '"Courier New"', "monospace"],
      },
      fontSize: {
        xs: "0.6rem",
        xxs: "0.7rem",
        xxxs: "0.75rem",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        // Existing shadcn colors
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        chart: {
          1: "var(--chart-1)",
          2: "var(--chart-2)",
          3: "var(--chart-3)",
          4: "var(--chart-4)",
          5: "var(--chart-5)",
        },
        // Game-specific colors
        game: {
          "bg-primary": "#1d3557", // Main background gradient start
          "bg-secondary": "#0b132b", // Main background gradient end
          panel: "rgba(13, 27, 42, 0.85)", // Panel background
          accent: "#ffca3a", // Yellow accent color
          text: "#f1faee", // Main text color
          blue: "#457b9d", // Blue accent
          "green-start": "#43aa8b", // Button gradient start
          "green-end": "#277da1", // Button gradient end
          "blue-start": "#457b9d", // Alt button gradient start
          "blue-end": "#1d3557", // Alt button gradient end
        },
      },
      backgroundImage: {
        "game-radial":
          "radial-gradient(circle at top, #1d3557 0%, #0b132b 70%)",
        "btn-primary": "linear-gradient(135deg, #43aa8b 0%, #277da1 100%)",
        "btn-secondary": "linear-gradient(135deg, #457b9d 0%, #1d3557 100%)",
        "btn-primary-hover":
          "linear-gradient(135deg, #56c4a3 0%, #309fc9 100%)",
        "btn-secondary-hover":
          "linear-gradient(135deg, #6c9bd1 0%, #2d4a6b 100%)",
      },
      boxShadow: {
        game: "0 20px 40px rgba(0, 0, 0, 0.4)",
        "game-sm": "0 4px 12px rgba(0, 0, 0, 0.3)",
        "game-md": "0 4px 8px rgba(0, 0, 0, 0.3)",
        "game-lg": "0 6px 12px rgba(0, 0, 0, 0.4)",
      },
      backdropBlur: {
        game: "8px",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
