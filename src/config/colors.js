/**
 * Centralized Color System - Dark and Light Themes with Gold Accents
 * 
 * This is the single source of truth for all colors used in the application.
 * All components should import colors from this file instead of hardcoding hex values.
 * 
 * Tailwind colors are defined in tailwind.config.js and should match these values.
 */

// Dark Theme Colors
export const darkTheme = {
  // Dark Theme Base Colors (Lightened)
  background: "#151515",               // Background (lightened from #0C0C0C)
  backgroundPrimary: "#151515",        // Background (alias)
  card: "#1C1C1C",                     // Cards (lightened from #151515)
  backgroundSecondary: "#1C1C1C",      // Cards (alias)
  cardDepth: "#242424",                // Card Depth (lightened from #1C1C1C)
  border: "#2A2A2A",                   // Borders (lightened from #242424)
  divider: "#303030",                  // Divider Lines (lightened from #2A2A2A)
  
  // Accent Colors (Gold)
  primaryAccent: "#E3B857",            // Primary Accent (Gold)
  secondaryAccent: "#C9A44A",          // Secondary Accent (Gold)
  mutedAccent: "#8A742E",              // Muted Accent (Gold)
  
  // Text Colors
  textPrimary: "#F2F2F2",              // Primary Text
  textSecondary: "#B8B8B8",            // Secondary Text
  textMuted: "#7A7A7A",                // Muted Text
  
  // Legacy name mappings (updated to use new dark theme + gold accents)
  // These are kept for backward compatibility with existing code
  primary: "#E3B857",                  // Maps to primaryAccent (Gold)
  primaryGreen: "#E3B857",             // Maps to primaryAccent (Gold)
  brandGreen: "#E3B857",               // Maps to primaryAccent (Gold)
  textBrandGreen: "#E3B857",           // Maps to primaryAccent text (Gold)
  gold: "#E3B857",                     // Maps to primaryAccent (Gold)
  
  // Background colors (updated to dark theme - lightened)
  black: "#151515",                    // Maps to background
  brandBlack: "#151515",               // Maps to background
  white: "#1C1C1C",                    // Maps to card
  mainWhite: "#1C1C1C",                // Maps to card
  brandWhite: "#1C1C1C",               // Maps to card
  brandGray: "#2A2A2A",                // Maps to border
  brandMaroon: "#1C1C1C",              // Maps to card
  
  // Text colors (updated to new text colors)
  textBrandPrimary: "#F2F2F2",         // Maps to textPrimary
  textBrandYellow: "#B8B8B8",          // Maps to textSecondary
  textBrandMaroon: "#F2F2F2",          // Maps to textPrimary
  
  // Error/Warning Colors (kept - functional colors)
  red: "#E63946",                      // Deep Red (for errors or warnings)
  brandRed: "#E63946",                 // Deep Red (Call to Action, Alerts)
  brandYellow: "#9a653a",              // Soft Orange (for warnings)
  
  // Additional UI Colors
  itemSelectedColor: "#242424",        // Card Depth for selected items
};

// Light Theme Colors
export const lightTheme = {
  // Light Theme Base Colors
  background: "#F5F5F5",               // Background
  backgroundPrimary: "#F5F5F5",        // Background (alias)
  card: "#FFFFFF",                     // Cards
  backgroundSecondary: "#FFFFFF",      // Cards (alias)
  cardDepth: "#FAFAFA",                // Card Depth
  border: "#E0E0E0",                   // Borders
  divider: "#D0D0D0",                  // Divider Lines
  
  // Accent Colors (Gold) - Same for both themes
  primaryAccent: "#E3B857",            // Primary Accent (Gold)
  secondaryAccent: "#C9A44A",          // Secondary Accent (Gold)
  mutedAccent: "#8A742E",              // Muted Accent (Gold)
  
  // Text Colors
  textPrimary: "#0A0A0A",              // Primary Text (darker for better contrast)
  textSecondary: "#2A2A2A",            // Secondary Text (darker for better contrast)
  textMuted: "#666666",                // Muted Text (darker for better readability)
  
  // Legacy name mappings (light theme)
  primary: "#E3B857",                  // Maps to primaryAccent (Gold)
  primaryGreen: "#E3B857",             // Maps to primaryAccent (Gold)
  brandGreen: "#E3B857",               // Maps to primaryAccent (Gold)
  textBrandGreen: "#E3B857",           // Maps to primaryAccent text (Gold)
  gold: "#E3B857",                     // Maps to primaryAccent (Gold)
  
  // Background colors (light theme)
  black: "#0A0A0A",                    // Maps to textPrimary
  brandBlack: "#0A0A0A",               // Maps to textPrimary
  white: "#FFFFFF",                    // Maps to card
  mainWhite: "#FFFFFF",                // Maps to card
  brandWhite: "#FFFFFF",               // Maps to card
  brandGray: "#E0E0E0",                // Maps to border
  brandMaroon: "#FFFFFF",              // Maps to card
  
  // Text colors (light theme)
  textBrandPrimary: "#0A0A0A",         // Maps to textPrimary
  textBrandYellow: "#2A2A2A",          // Maps to textSecondary
  textBrandMaroon: "#0A0A0A",          // Maps to textPrimary
  
  // Error/Warning Colors (kept - functional colors)
  red: "#E63946",                      // Deep Red (for errors or warnings)
  brandRed: "#E63946",                 // Deep Red (Call to Action, Alerts)
  brandYellow: "#9a653a",              // Soft Orange (for warnings)
  
  // Additional UI Colors
  itemSelectedColor: "#F0F0F0",        // Card Depth for selected items
};

// Default export (dark theme for backward compatibility)
export const colors = darkTheme;
export default colors;
