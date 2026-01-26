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
