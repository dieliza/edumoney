import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { ActivityIndicator, Appearance, Platform, Text, useColorScheme, View } from 'react-native';
import { createThemePreferences } from './preference';
import {applyCrashBoat} from './crashBoat';
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
      Appearance.setColorScheme(preference === 'automatic' ? 'auto' : resolveTheme(preference, system));
    }
  }, [preference, ready,system]);
  useEffect(()=>ready?applyCrashBoat(preference):undefined,[preference,ready]);
  const name = resolveTheme(preference, system);
  const value = useMemo(() => ({ name, preference, colors: preference==='crash-boat'?{...palettes[name],muted:'#304551'}:palettes[name], setPreference, notice }), [name, preference, setPreference, notice]);
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

/** Presentación de gráficas y filas sobre el fondo nativo de la pantalla. */
export function NativeSurfaceTheme({children}:PropsWithChildren){
  const theme=useTheme();
  const value=useMemo(()=>theme.preference==='crash-boat'?theme:({...theme,colors:theme.name==='dark'?{...theme.colors,
    surface:'transparent',surfaceAlt:'rgba(255,255,255,0.06)',text:'#F0FFF9',muted:'#CEE8E8',
    primary:'#8DEBC4',line:'rgba(206,238,232,0.25)',mint:'rgba(42,218,153,0.12)',
    coral:'rgba(255,98,133,0.12)',progressTrack:'rgba(210,244,234,0.16)',
  }:{...theme.colors,surface:'transparent',surfaceAlt:'rgba(0,82,68,0.05)'}}),[theme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
export {NativeSurfaceTheme as NativeChartTheme};
