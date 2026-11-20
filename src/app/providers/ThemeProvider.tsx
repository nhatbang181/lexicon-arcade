import React, { createContext, useContext, useEffect, useState } from 'react';

export type AppTheme = 'dark' | 'light' | 'exam';

export interface TargetBands {
  L: number;
  R: number;
  W: number;
  S: number;
}

export interface ThemeContextValue {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  targetBands: TargetBands;
  setTargetBands: React.Dispatch<React.SetStateAction<TargetBands>>;
  dailyGoalMin: number;
  setDailyGoalMin: (min: number) => void;
}

const DEFAULT_TARGETS: TargetBands = {
  L: 8.5,
  R: 8.5,
  W: 7.5,
  S: 7.5,
};

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  setTheme: () => undefined,
  targetBands: DEFAULT_TARGETS,
  setTargetBands: () => undefined,
  dailyGoalMin: 45,
  setDailyGoalMin: () => undefined,
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<AppTheme>('dark');
  const [targetBands, setTargetBands] = useState<TargetBands>(DEFAULT_TARGETS);
  const [dailyGoalMin, setDailyGoalMin] = useState<number>(45);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    if (theme === 'exam') {
      root.setAttribute('data-mode', 'exam');
    } else {
      root.removeAttribute('data-mode');
    }
  }, [theme]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        targetBands,
        setTargetBands,
        dailyGoalMin,
        setDailyGoalMin,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
