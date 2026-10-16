// mobile/src/context/ThemeContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { StorageService } from '../services/storage';
import { getThemeColors, updateGlobalColors } from '../constants/theme';

const ThemeContext = createContext({
  theme: 'dark',
  isDark: true,
  toggleTheme: () => {},
  setTheme: () => {},
  colors: getThemeColors('dark'),
});

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState('dark');

  useEffect(() => {
    let mounted = true;
    StorageService.getTheme().then((stored) => {
      if (mounted && stored) {
        setThemeState(stored);
        updateGlobalColors(stored);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const setTheme = async (newTheme) => {
    setThemeState(newTheme);
    updateGlobalColors(newTheme);
    await StorageService.setTheme(newTheme);
  };

  const toggleTheme = async () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    await setTheme(nextTheme);
  };

  const colors = getThemeColors(theme);
  const isDark = theme === 'dark';

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme, setTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
export default ThemeContext;
