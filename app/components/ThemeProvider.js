'use client'
import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext({ theme: 'dark', setTheme: () => {} });

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState('dark');

  useEffect(() => {
    const stored = localStorage.getItem('theme') || 'dark';
    setThemeState(stored);
  }, []);

  function setTheme(t) {
    setThemeState(t);
    localStorage.setItem('theme', t);
    document.documentElement.setAttribute('data-theme', t);
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
