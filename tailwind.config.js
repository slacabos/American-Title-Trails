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
        // Game-specific colors - imported from constants/colors.ts
        // Note: These should match the GAME_COLORS object for consistency
        game: {
          primary: "#E84B26", // Bright orange-red - Action buttons, key highlights
          accent: "#F9D65B", // Warm yellow - Headings, neon edges, focus rings
          asphalt: "#2C3039", // Blue-gray - Backgrounds, road textures
          grass: "#6E7F4F", // Olive green - Map elements, tiles
          road: "#474B52", // Neutral gray - Secondary surfaces
          neutral: "#1F2229", // Deep navy-gray - App shell, footer, dark UI
          text: "#f1faee", // Light text color for contrast
          // Legacy aliases for backward compatibility
          "bg-primary": "#2C3039",
          "bg-secondary": "#1F2229",
          panel: "rgba(47, 48, 57, 0.85)",
          blue: "#2C3039",
        },
      },
      backgroundImage: {
        "game-radial":
          "radial-gradient(circle at top, #2C3039 0%, #1F2229 70%)",
        "btn-primary": "linear-gradient(135deg, #E84B26 0%, #d63e1f 100%)",
        "btn-secondary": "linear-gradient(135deg, #474B52 0%, #2C3039 100%)",
        "btn-primary-hover":
          "linear-gradient(135deg, #f55d3a 0%, #E84B26 100%)",
        "btn-secondary-hover":
          "linear-gradient(135deg, #5a5e67 0%, #474B52 100%)",
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
