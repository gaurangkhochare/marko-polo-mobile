import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { useColorScheme as useSystemColorScheme } from 'react-native';

export type ThemePreference = 'system' | 'light' | 'dark';
export type ColorScheme = 'light' | 'dark';

export type ThemeColors = {
  background: string;
  surface: string;
  text: string;
  secondaryText: string;
  muted: string;
  border: string;
  accent: string;
  accentText: string;
  chip: string;
  tagBackground: string;
  tagText: string;
  danger: string;
  field: string;
  pinBackground: string;
  pinText: string;
  archiveBackground: string;
};

const THEME_KEY = 'theme_preference';

const colorsByScheme: Record<ColorScheme, ThemeColors> = {
  light: {
    background: '#f4f7fb',
    surface: '#ffffff',
    text: '#111827',
    secondaryText: '#475569',
    muted: '#64748b',
    border: '#e5eaf1',
    accent: '#2563eb',
    accentText: '#ffffff',
    chip: '#e8edf5',
    tagBackground: '#ccfbf1',
    tagText: '#0f766e',
    danger: '#b91c1c',
    field: '#f9fafb',
    pinBackground: '#fef9c3',
    pinText: '#854d0e',
    archiveBackground: '#dbeafe',
  },
  dark: {
    background: '#0b1220',
    surface: '#151f30',
    text: '#f1f5f9',
    secondaryText: '#cbd5e1',
    muted: '#94a3b8',
    border: '#334155',
    accent: '#2563eb',
    accentText: '#f4f7fb',
    chip: '#263449',
    tagBackground: '#134e4a',
    tagText: '#99f6e4',
    danger: '#f87171',
    field: '#101a2a',
    pinBackground: '#713f12',
    pinText: '#fde68a',
    archiveBackground: '#1e3a8a',
  },
};

type ThemeContextValue = {
  preference: ThemePreference;
  scheme: ColorScheme;
  colors: ThemeColors;
  setPreference: (preference: ThemePreference) => Promise<void>;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useSystemColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');

  useEffect(() => {
    void SecureStore.getItemAsync(THEME_KEY)
      .then((storedPreference) => {
        if (
          storedPreference === 'system' ||
          storedPreference === 'light' ||
          storedPreference === 'dark'
        ) {
          setPreferenceState(storedPreference);
        }
      })
      .catch((error: unknown) => {
        console.error('Unable to load theme preference:', error);
      });
  }, []);

  const setPreference = useCallback(async (nextPreference: ThemePreference) => {
    await SecureStore.setItemAsync(THEME_KEY, nextPreference);
    setPreferenceState(nextPreference);
  }, []);

  const scheme: ColorScheme =
    preference === 'system'
      ? systemScheme === 'dark'
        ? 'dark'
        : 'light'
      : preference;

  const value = useMemo(
    () => ({
      preference,
      scheme,
      colors: colorsByScheme[scheme],
      setPreference,
    }),
    [preference, scheme, setPreference],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used inside ThemeProvider');
  }
  return context;
}

export function nextThemePreference(preference: ThemePreference): ThemePreference {
  if (preference === 'system') return 'light';
  return preference === 'light' ? 'dark' : 'system';
}
