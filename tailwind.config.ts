import type {Config} from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme";

const {fontFamily} = defaultTheme;
// Tailwind v4 config with shadcn-style design tokens mapped to CSS variables.
// This ensures utilities like bg-card, text-card-foreground, border-border, ring, etc. are valid
// and fixes many of the Tailwind lint warnings shown in Code Analysis.
const config: Config = {
    darkMode: "class",
    content: [
        // Frontend sources
        "./app/**/*.{ts,tsx}",
        "./components/**/*.{ts,tsx}",
        "./contexts/**/*.{ts,tsx}",
        "./lib/**/*.{ts,tsx}",

        // Local packages (games + libs)
        "./games/**/*.{ts,tsx}",
        "./libs/**/*.{ts,tsx}",

        "../../apps/**/*.{js,ts,jsx,tsx}",
        "../../packages/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ["var(--font-inter)", ...fontFamily.sans],
            },
            colors: {
                // Core semantic tokens mapped to CSS variables (defined in globals.css)
                border: "var(--border)",
                input: "var(--input)",
                ring: "var(--ring)",
                background: "var(--background)",
                foreground: "var(--foreground)",

                primary: {
                    DEFAULT: "var(--primary)",
                    foreground: "var(--primary-foreground)",
                },
                secondary: {
                    DEFAULT: "var(--secondary)",
                    foreground: "var(--secondary-foreground)",
                },
                destructive: {
                    DEFAULT: "var(--destructive)",
                    foreground: "var(--destructive-foreground)",
                },
                muted: {
                    DEFAULT: "var(--muted)",
                    foreground: "var(--muted-foreground)",
                },
                accent: {
                    DEFAULT: "var(--accent)",
                    foreground: "var(--accent-foreground)",
                },
                popover: {
                    DEFAULT: "var(--popover)",
                    foreground: "var(--popover-foreground)",
                },
                card: {
                    DEFAULT: "var(--card)",
                    foreground: "var(--card-foreground)",
                },

                // Brand palette from requirements (kept for direct usage where needed)
                emerald: {
                    DEFAULT: "#10B981",
                    light: "#34D399",
                    dark: "#059669",
                    600: "#059669",
                    700: "#047857",
                },
                indigo: {
                    DEFAULT: "#5A67D8",
                    light: "#7F9CF5",
                    dark: "#4C51BF",
                    600: "#4F46E5", // royal blue
                    700: "#4338CA",
                },
                amber: {
                    DEFAULT: "#F59E0B",
                    light: "#FCD34D",
                    dark: "#D97706",
                    500: "#F59E0B", // royal gold / accent
                },
                auburn: {
                    DEFAULT: "#9B2C2C",
                    light: "#C53030",
                    dark: "#822727",
                    600: "#A52A2A",
                },
                purple: {
                    DEFAULT: "#805AD5",
                    light: "#9F7AEA",
                    dark: "#6B46C1",
                    800: "#3B0A45", // dark purple
                },
                orange: {
                    DEFAULT: "#DD6B20",
                    light: "#ED8936",
                    dark: "#C05621",
                    700: "#C2410C", // dark orange
                },
                // Custom palette colors
                "royal-blue": {
                    DEFAULT: "#2B6CB0",
                    light: "#3182CE",
                    dark: "#2C5282",
                },
                "royal-green": {
                    DEFAULT: "#2F855A",
                    light: "#38A169",
                    dark: "#276749",
                },
                "royal-orange": {
                    DEFAULT: "#DD6B20",
                    light: "#ED8936",
                    dark: "#C05621",
                },
                gold: {
                    DEFAULT: "#D69E2E",
                    light: "#ECC94B",
                    dark: "#B7791F",
                },
                // Gemstone Colors
                ruby: {
                    DEFAULT: "#E53E3E",
                    light: "#FC8181",
                    dark: "#C53030",
                },
                sapphire: {
                    DEFAULT: "#2563EB",
                    light: "#60A5FA",
                    dark: "#1D4ED8",
                },
                amethyst: {
                    DEFAULT: "#9F7AEA",
                    light: "#B794F4",
                    dark: "#805AD5",
                },
                jade: {
                    DEFAULT: "#10B981",
                    light: "#34D399",
                    dark: "#059669",
                },
                "lapis-lazuli": {
                    DEFAULT: "#26619C",
                    light: "#3B82F6",
                    dark: "#1E40AF",
                },
                peridot: {
                    DEFAULT: "#A2C523",
                    light: "#BEF264",
                    dark: "#84CC16",
                },
                moonstone: {
                    DEFAULT: "#3AA8C1",
                    light: "#67E8F9",
                    dark: "#0E7490",
                },
                spinel: {
                    DEFAULT: "#E15FED",
                    light: "#F0ABFC",
                    dark: "#C026D3",
                },
                aquamarine: {
                    DEFAULT: "#2DD4BF",
                    light: "#5EEAD4",
                    dark: "#0D9488",
                },
                turquoise: {
                    DEFAULT: "#0BC5EA",
                    light: "#76E4F7",
                    dark: "#0E7490",
                },
                tourmaline: {
                    DEFAULT: "#9F7AEA",
                    light: "#C4B5FD",
                    dark: "#7C3AED",
                },
                "rose-quartz": {
                    DEFAULT: "#F9A8D4",
                    light: "#FBCFE8",
                    dark: "#DB2777",
                },
                onyx: {
                    DEFAULT: "#1A202C",
                    light: "#2D3748",
                    dark: "#171923",
                },
                opal: {
                    DEFAULT: "#A7F3D0",
                    light: "#D1FAE5",
                    dark: "#10B981",
                },
                topaz: {
                    DEFAULT: "#F6E05E",
                    light: "#FEF08A",
                    dark: "#D69E2E",
                },
                coral: {
                    DEFAULT: "#F87171",
                    light: "#FCA5A5",
                    dark: "#DC2626",
                },
                pearl: {
                    DEFAULT: "#F3F4F6",
                    light: "#F9FAFB",
                    dark: "#E5E7EB",
                },
                blue: {
                    DEFAULT: "#3B82F6",
                    light: "#60A5FA",
                    dark: "#2563EB",
                },
                pink: {
                    DEFAULT: "#EC4899",
                    light: "#F472B6",
                    dark: "#DB2777",
                },
                obsidian: {
                    DEFAULT: "#1A202C",
                    light: "#2D3748",
                    dark: "#171923",
                },
                garnet: {
                    DEFAULT: "#9B2C2C",
                    light: "#C53030",
                    dark: "#822727",
                },
            },
        },
    },
    safelist: [
        // A few dynamic classes we toggle in template strings
        "bg-emerald-600",
        "bg-emerald-700",
        "bg-gray-200",
        "bg-gray-300",
        "dark:bg-gray-700",
        "dark:bg-gray-600",
        "text-gray-900",
        "dark:text-gray-100",
        "size-14",
        // Common dynamic utilities seen in components and tests
        "backdrop-blur",
        "bg-white/70",
        "dark:bg-gray-900/60",
        "ring-2",
        "outline",
        "outline-2",
    ],
    plugins: [
        require("@tailwindcss/typography"),
        require("@tailwindcss/forms")({
            strategy: "class", // Use class strategy for better control
        }),
    ],
} as Config;

export default config;
