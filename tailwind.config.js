/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Dark Theme Base Colors (Lightened)
        background: "#151515",           // Background (lightened from #0C0C0C)
        backgroundPrimary: "#151515",    // Background (alias)
        card: "#1C1C1C",                 // Cards (lightened from #151515)
        backgroundSecondary: "#1C1C1C",  // Cards (alias)
        cardDepth: "#242424",            // Card Depth (lightened from #1C1C1C)
        border: "#2A2A2A",               // Borders (lightened from #242424)
        divider: "#303030",              // Divider Lines (lightened from #2A2A2A)
        
        // Accent Colors (Gold)
        primaryAccent: "#E3B857",        // Primary Accent (Gold)
        secondaryAccent: "#C9A44A",      // Secondary Accent (Gold)
        mutedAccent: "#8A742E",          // Muted Accent (Gold)
        
        // Text Colors
        textPrimary: "#F2F2F2",          // Primary Text
        textSecondary: "#B8B8B8",        // Secondary Text
        textMuted: "#7A7A7A",            // Muted Text
        
        // Legacy name mappings (updated to use new dark theme + gold accents)
        // These map old names to new colors for backward compatibility
        primary: "#E3B857",              // Maps to primaryAccent (Gold)
        primaryGreen: "#E3B857",         // Maps to primaryAccent (Gold)
        brandGreen: "#E3B857",           // Maps to primaryAccent (Gold)
        textBrandGreen: "#E3B857",       // Maps to primaryAccent text (Gold)
        gold: "#E3B857",                 // Maps to primaryAccent (Gold)
        
        // Background colors (updated to dark theme - lightened)
        black: "#151515",                // Maps to background
        brandBlack: "#151515",           // Maps to background
        white: "#1C1C1C",                // Maps to card
        mainWhite: "#1C1C1C",            // Maps to card
        brandWhite: "#1C1C1C",           // Maps to card
        brandGray: "#2A2A2A",            // Maps to border
        brandMaroon: "#1C1C1C",          // Maps to card
        
        // Text colors (updated to new text colors)
        textBrandPrimary: "#F2F2F2",     // Maps to textPrimary
        textBrandYellow: "#B8B8B8",      // Maps to textSecondary
        textBrandMaroon: "#F2F2F2",      // Maps to textPrimary
        
        // Error/Warning Colors (kept - functional colors)
        red: "#E63946",                  // Deep Red (for errors)
        brandRed: "#E63946",             // Deep Red (Call to Action, Alerts)
        brandYellow: "#9a653a",          // Soft Orange (for warnings)
      },
    
      fontFamily: {
        sans: ["Roboto", "sans-serif"],
      },
    },
  },
  plugins: [],
};
