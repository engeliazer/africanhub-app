import React, { createContext, useContext, useState, useEffect } from 'react';
import { darkTheme, lightTheme } from '../config/colors';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Get theme from localStorage or default to 'dark'
    const savedTheme = localStorage.getItem('appTheme');
    return savedTheme || 'dark';
  });

  const [colors, setColors] = useState(theme === 'dark' ? darkTheme : lightTheme);

  useEffect(() => {
    // Update colors when theme changes
    setColors(theme === 'dark' ? darkTheme : lightTheme);
    
    // Save theme preference to localStorage
    localStorage.setItem('appTheme', theme);
    
    // Update CSS variables for global styles
    const root = document.documentElement;
    const currentColors = theme === 'dark' ? darkTheme : lightTheme;
    
    root.style.setProperty('--color-background', currentColors.background);
    root.style.setProperty('--color-card', currentColors.card);
    root.style.setProperty('--color-card-depth', currentColors.cardDepth);
    root.style.setProperty('--color-border', currentColors.border);
    root.style.setProperty('--color-text-primary', currentColors.textPrimary);
    root.style.setProperty('--color-text-secondary', currentColors.textSecondary);
    root.style.setProperty('--color-text-muted', currentColors.textMuted);
    root.style.setProperty('--color-primary-accent', currentColors.primaryAccent);
    root.style.setProperty('--color-secondary-accent', currentColors.secondaryAccent);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'dark' ? 'light' : 'dark');
  };

  const value = {
    theme,
    colors,
    toggleTheme,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
