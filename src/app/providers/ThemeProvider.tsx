import React, { createContext, useContext, useEffect, useState } from 'react';
import { MotionConfig } from 'motion/react';
import { useMotionPref } from '../../design/fx/motionPref';

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
  if (displayFontLoaded || typeof FontFace === 'undefined' || !document?.fonts) return;
  displayFontLoaded = true;
  const base = (import.meta.env?.BASE_URL ?? '/').replace(/\/?$/, '/');
  for (const [sub, range] of [
    ['vietnamese', 'U+0102-0103,U+0110-0111,U+0128-0129,U+0168-0169,U+01A0-01A1,U+01AF-01B0,U+1EA0-1EF9,U+20AB'],
    ['latin', 'U+0020-007E,U+2013-2026,U+00B0-00B7,U+00D7,U+2248'],
  ] as const) {
    const face = new FontFace('Baloo 2', `url(${base}assets/fonts/baloo-2-${sub}-700.woff2) format("woff2")`, {
      weight: '700',
      display: 'swap',
      unicodeRange: range,
    });
    document.fonts.add(face);
    void face.load().catch(() => undefined);
  }
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<AppTheme>('dark');
  const [targetBands, setTargetBands] = useState<TargetBands>(DEFAULT_TARGETS);
  const [dailyGoalMin, setDailyGoalMin] = useState<number>(45);
  const { reducedMotion } = useMotionPref();

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

  useEffect(() => {
    const root = document.documentElement;
    if (reducedMotion) {
      root.setAttribute('data-reduced-motion', 'true');
    } else {
      root.removeAttribute('data-reduced-motion');
    }
  }, [reducedMotion]);

  return (
    <MotionConfig reducedMotion={reducedMotion ? 'always' : 'user'}>
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
    </MotionConfig>
  );
};

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
