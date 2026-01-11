/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: " #277186",       // Teal (Main Brand Color)
        primaryGreen: " #277186",  // Teal (for consistency)
        red: " #E63946",          // Deep Red (for errors or warnings)
        black: " #2D2D2D",        // Dark Grey (Primary Dark Theme)
        white: " #F5F5F5",        // Off-White (Background)
        textPrimary: " #2D2D2D",  // Dark Grey (Main Text)
        mainWhite: " #F5F5F5",    // Off-White
        brandRed: " #E63946",     // Deep Red (Call to Action, Alerts)
        brandBlack: " #2D2D2D",   // Dark Grey
        brandWhite: " #F5F5F5",   // Off-White
        brandGreen: " #277186",   // Teal (Primary Accent)
        brandYellow: " #9a653a",  // Soft Orange (for warnings)
        brandMaroon: " #277186",  // Deep Maroon (Secondary Accent)
        textBrandPrimary: " #2D2D2D", // Dark Grey
        textBrandGreen: " #277186",   // Teal
        textBrandYellow: " #9a653a",  // Soft Orange
        textBrandMaroon: " #277186",  // Deep Maroon
        brandGray: " #EAEAEA",        // Light Grey (for UI elements)
    },
    
      fontFamily: {
        sans: ["Roboto", "sans-serif"],
      },
    },
  },
  plugins: [],
};