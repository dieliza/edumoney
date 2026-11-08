import { fixed } from '../design/tokens';
import { useEffect, useState, type PropsWithChildren } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { prepareStorage } from './storageStatus';
import { useTheme } from '../design/ThemeProvider';
export function StorageGate({ children }: PropsWithChildren) {
  const { name, colors } = useTheme();
  const [state, setState] = useState<'opening' | 'ready' | 'error'>('opening');
  useEffect(() => {
    let active = true;
    prepareStorage().then(() => { if (active) setState('ready'); })
      .catch(() => { if (active) setState('error'); });
    return () => { active = false; };
  }, []);
  if (state === 'ready') return children;
  return <View style={{ flex: 1, padding: 28, gap: 20, justifyContent: 'center', backgroundColor: colors.background }}>
    {state === 'opening' ? <ActivityIndicator color={colors.accent} /> : null}
    <Text accessibilityLiveRegion="polite" style={{ fontSize: 19, color: name === 'dark' ? fixed.white : colors.text }}>
      {state === 'opening' ? 'Preparando tu espacio seguro…' : 'No pudimos abrir el almacenamiento protegido. Desbloquea el dispositivo e inténtalo de nuevo. Conserva los datos de la app si necesitas recuperarlos.'}
    </Text>
  </View>;
}
