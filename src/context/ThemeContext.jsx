import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { ThemeProvider as MuiThemeProvider, CssBaseline } from '@mui/material';
import { DarkTheme, LightTheme } from '../theme';

const ThemeContext = createContext();

export const useThemeContext = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used within a CustomThemeProvider');
  }
  return context;
};

export const CustomThemeProvider = ({ children }) => {
  const [mode, setMode] = useState(() => {
    // Initialize theme mode from localStorage or default to dark
    const savedMode = localStorage.getItem('themeMode');
    return savedMode || 'dark';
  });

  useEffect(() => {
    // Update localStorage when mode changes
    localStorage.setItem('themeMode', mode);
    // Apply class to body for global CSS adjustments
    document.body.classList.remove('dark-theme', 'light-theme');
    document.body.classList.add(`${mode}-theme`);
  }, [mode]);

  const toggleTheme = () => {
    setMode((prevMode) => (prevMode === 'dark' ? 'light' : 'dark'));
  };

  const theme = useMemo(() => (mode === 'dark' ? DarkTheme : LightTheme), [mode]);

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline /> {/* Resets CSS and applies base styles */}
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};
