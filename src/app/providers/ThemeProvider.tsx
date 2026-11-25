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

let displayFontLoaded = false;

function ensureDisplayFont(): void {
  if (displayFontLoaded) return;
  if (typeof FontFace === 'undefined' || typeof document === 'undefined' || !document.fonts) return;
  displayFontLoaded = true;
  const baseRaw = import.meta.env?.BASE_URL ?? '/';
  const base = baseRaw.endsWith('/') ? baseRaw : `${baseRaw}/`;
  const faces = [
    new FontFace('Baloo 2', `url(${base}assets/fonts/baloo-2-vietnamese-700.woff2) format("woff2")`, {
      weight: '700',
      style: 'normal',
      display: 'swap',
      unicodeRange:
        'U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+0300-0301, U+0303-0304, U+0308-0309, U+0323, U+0329, U+1EA0-1EF9, U+20AB',
    }),
    new FontFace('Baloo 2', `url(${base}assets/fonts/baloo-2-latin-700.woff2) format("woff2")`, {
      weight: '700',
      style: 'normal',
      display: 'swap',
      unicodeRange: 'U+0020-007E, U+2013-2014, U+2018-2019, U+201C-201D, U+2022, U+2026, U+00B0-00B1, U+00B7, U+00D7, U+2248',
    }),
  ];
  for (const face of faces) {
    document.fonts.add(face);
    void face.load().catch(() => {
      // Fallback sang Be Vietnam Pro nếu offline chưa kịp tải font hiển thị
    });
  }
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<AppTheme>('dark');
  const [targetBands, setTargetBands] = useState<TargetBands>(DEFAULT_TARGETS);
  const [dailyGoalMin, setDailyGoalMin] = useState<number>(45);

  useEffect(() => {
    ensureDisplayFont();
  }, []);

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
