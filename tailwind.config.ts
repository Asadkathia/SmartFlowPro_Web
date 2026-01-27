import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: ["class"],
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                // Ring/Border tokens (for focus states)
                ring: "#494949",
                border: "#e2e8f0",
                input: "#e2e8f0",

                // Foreground tokens
                foreground: "#494949",
                "card-foreground": "#494949",
                "muted-foreground": "#64748b",

                // Muted/Accent surfaces
                muted: "#f1f5f9",
                accent: "#f1f5f9",
                "accent-foreground": "#494949",

                // Secondary (neutral)
                secondary: "#f1f5f9",
                "secondary-foreground": "#494949",

                // Destructive (error)
                destructive: "#EF4444",
                "destructive-foreground": "#FFFFFF",

                // Semantic colors
                primary: {
                    DEFAULT: "#494949", // Dark Grey
                    foreground: "#FFFFFF",
                },
                background: "#FFFDF6", // Cream
                surface: "#FFFFFF",
                "surface-highlight": "#FAF6E9", // Beige

                // Text colors
                text: {
                    primary: "#494949", // Dark Grey
                    secondary: "#6B7280", // Grey
                },

                // Brand Palette
                brand: {
                    beige: "#FAF6E9",
                    lightBeige: "#ECE8D9",
                    cream: "#FFFDF6",
                    darkGrey: "#494949",
                },

                // Status colors
                success: "#10B981",
                warning: "#F59E0B",
                error: "#EF4444",
                info: "#0EA5E9",
                scheduled: "#6B7280",
            },
            fontFamily: {
                sans: ["var(--font-inter)", "sans-serif"],
            },
        },
    },
    plugins: [],
};
export default config;
