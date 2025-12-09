import React, { createContext, useState, useEffect, useCallback } from 'react';
import { FontTheme, ColorMode } from './themeConfig';
import { useUser } from '../../hooks';
import { useSettings } from '../../hooks/useSettings/useSettings';

interface ThemeContextType {
  mode: ColorMode;
  fontTheme: FontTheme;
  setMode: (mode: ColorMode) => Promise<void>;
  setFontTheme: (theme: FontTheme) => Promise<void>;
  isLoading: boolean;
}

export const ThemeContext = createContext<ThemeContextType | null>(null);

const DEFAULT_MODE: ColorMode = 'dark';
const DEFAULT_FONT_THEME: FontTheme = 'IBM_PLEX'; // STANDARD ISSUE - default for splash page and new users

export const ThemeContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useUser();
  const { settings, saveSetting: saveSettingHook, isLoading: settingsLoading } = useSettings(
    user?.id?.toString() || ''
  );
  
  const [mode, setModeState] = useState<ColorMode>(DEFAULT_MODE);
  const [fontTheme, setFontThemeState] = useState<FontTheme>(DEFAULT_FONT_THEME);
  const [isLoading, setIsLoading] = useState(true);

  // Load theme preferences from settings
  useEffect(() => {
    // If no user, use default theme (IBM_PLEX - STANDARD ISSUE) for splash page
    if (!user) {
      setModeState(DEFAULT_MODE);
      setFontThemeState(DEFAULT_FONT_THEME);
      setIsLoading(false);
      return;
    }

    if (settingsLoading) {
      setIsLoading(settingsLoading);
      return;
    }

    if (!settings || settings.length === 0) {
      setIsLoading(false);
      return;
    }

    const themeModeSetting = settings.find(s => s.setting_key === 'theme_mode');
    const fontThemeSetting = settings.find(s => s.setting_key === 'font_theme');

    if (themeModeSetting) {
      const savedMode = themeModeSetting.setting_value as ColorMode;
      if (savedMode === 'light' || savedMode === 'dark') {
        setModeState(savedMode);
      }
    }

    if (fontThemeSetting) {
      const savedFontTheme = fontThemeSetting.setting_value as FontTheme;
      if (['SPACE_GROTESK', 'RAJDHANI', 'IBM_PLEX'].includes(savedFontTheme)) {
        setFontThemeState(savedFontTheme);
      }
    }

    setIsLoading(false);
  }, [user, settings, settingsLoading]);

  const setMode = useCallback(async (newMode: ColorMode) => {
    setModeState(newMode);
    
    if (user?.id) {
      try {
        await saveSettingHook({
          setting_key: 'theme_mode',
          setting_value: newMode,
        });
      } catch (error) {
        console.error('Failed to save theme mode:', error);
      }
    }
  }, [user, saveSettingHook]);

  const setFontTheme = useCallback(async (newTheme: FontTheme) => {
    setFontThemeState(newTheme);
    
    if (user?.id) {
      try {
        await saveSettingHook({
          setting_key: 'font_theme',
          setting_value: newTheme,
        });
      } catch (error) {
        console.error('Failed to save font theme:', error);
      }
    }
  }, [user, saveSettingHook]);

  const value: ThemeContextType = {
    mode,
    fontTheme,
    setMode,
    setFontTheme,
    isLoading,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

