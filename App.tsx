import { useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { openLocalDatabase } from './src/storage/database';

export default function App() {
  const [state, setState] = useState<'opening' | 'ready' | 'error'>('opening');
  useEffect(() => {
    let active = true;
    openLocalDatabase().then(() => { if (active) setState('ready'); })
      .catch(() => { if (active) setState('error'); });
    return () => { active = false; };
  }, []);
  return <SafeAreaView style={styles.screen}>
    <StatusBar style="light" />
    <View style={styles.content}>
      <Text accessibilityRole="header" style={styles.title}>EduMoney</Text>
      <Text style={styles.text}>Base técnica · Etapa 1</Text>
      <Text accessibilityLiveRegion="polite" style={styles.text}>
        {state === 'opening' ? 'Preparando almacenamiento local…' : state === 'ready'
          ? 'Almacenamiento local cifrado preparado.'
          : 'No se pudo abrir el almacenamiento seguro. Se requiere una compilación nativa con SQLCipher. Si ya tenías datos, consérvalos para recuperación.'}
      </Text>
      <Text style={styles.text}>Sin cuentas en línea. Sin sincronización automática. Sin IA.</Text>
    </View>
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#082634' },
  content: { flex: 1, justifyContent: 'center', padding: 24, gap: 20 },
  title: { color: '#8CE6BB', fontSize: 34, fontWeight: '700' },
  text: { color: '#F1F7F5', fontSize: 18, lineHeight: 28 },
});
