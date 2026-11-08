import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { ActivityIndicator, Appearance, Platform, Text, useColorScheme, View } from 'react-native';
import { createThemePreferences } from './preference';
import { fixed, palettes, resolveTheme, type ThemePreference, type ThemeName, type Palette } from './tokens';
const preferences = createThemePreferences(AsyncStorage);
interface ThemeState { name: ThemeName; preference: ThemePreference; colors: Palette; setPreference(value: ThemePreference): void; notice: string | null }
const ThemeContext = createContext<ThemeState | null>(null);
export function ThemeProvider({ children }: PropsWithChildren) {
  const system = useColorScheme();
  const [preference, setValue] = useState<ThemePreference>('automatic');
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    preferences.read().then(value => { if (active) setValue(value); })
      .catch(() => { if (active) setNotice('No pudimos recuperar tu tema guardado. Puedes elegirlo de nuevo.'); })
      .finally(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, []);
  const setPreference = useCallback((value: ThemePreference) => {
    setValue(value);
    preferences.write(value).then(() => setNotice(null))
      .catch(() => setNotice('El tema cambió, pero no pudo guardarse. Vuelve a seleccionarlo para reintentar.'));
  }, []);
  useEffect(() => {
    if (ready && Platform.OS !== 'web') {
      // RN 0.88: 'auto' restaura el seguimiento del sistema. Solo afecta a esta app.
      Appearance.setColorScheme(preference === 'automatic' ? 'auto' : preference);
    }
  }, [preference, ready]);
  const name = resolveTheme(preference, system);
  const value = useMemo(() => ({ name, preference, colors: palettes[name], setPreference, notice }), [name, preference, setPreference, notice]);
  if (!ready) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: palettes[name].background }}>
    <ActivityIndicator color={palettes[name].accent} accessibilityLabel="Cargando tu preferencia de apariencia" />
    <Text style={{ color: name === 'dark' ? fixed.white : fixed.ink, marginTop: 12 }}>Preparando EduMoney…</Text>
  </View>;
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
export function useTheme() {
  const theme = useContext(ThemeContext);
  if (!theme) throw new Error('Falta ThemeProvider');
  return theme;
}
