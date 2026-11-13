import { useEffect, useState, type PropsWithChildren } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { hasWebVault, unlockWebVault } from '../web/vault';
import { useTheme } from '../design/ThemeProvider';
import { router } from 'expo-router';
import { Brand } from './Brand';
import { ActionButton, Body, Card } from './components';
import { Field } from '../modules/money/fields';
export function StorageGate({ children }: PropsWithChildren) {
  const { colors } = useTheme();
  const [exists, setExists] = useState<boolean>(); const [password, setPassword] = useState(''); const [repeat, setRepeat] = useState('');
  const [ready, setReady] = useState(false); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  useEffect(() => { void hasWebVault().then(setExists).catch(() => setError('El navegador bloqueó el almacenamiento local. Abre la app en una pestaña normal.')); }, []);
  async function open() { if (busy) return; setError(''); if (!exists && password !== repeat) { setError('Las contraseñas no coinciden.'); return; } setBusy(true); try { await unlockWebVault(password); setPassword(''); setRepeat(''); setReady(true); } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo abrir tu espacio local.'); } finally { setBusy(false); } }
  if (ready) return <View style={{ flex: 1 }}><View style={{ backgroundColor: colors.surface, paddingHorizontal: 12, paddingVertical: 4, flexDirection: 'row', gap: 8 }}><View style={{flex:1}}><ActionButton title="Sincronizar" secondary onPress={() => router.push('/sync')}/></View><View style={{flex:1}}><ActionButton title="Bloquear EduMoney" secondary onPress={() => window.location.reload()}/></View></View>{children}</View>;
  return <ScrollView keyboardShouldPersistTaps="handled" style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}><View style={{ width: '100%', maxWidth: 520, alignSelf: 'center', gap: 18 }}>
    <View style={{ alignItems: 'center' }}><Brand large/></View>
    <Card><Body style={{ fontSize: 24, fontWeight: '800' }}>{exists ? 'Desbloquear EduMoney' : 'Tu espacio privado'}</Body>
      <Body>Tu dinero y tu negocio, también desde el navegador. Los datos se guardan cifrados en este dispositivo.</Body>
      <Body muted>Esta contraseña es local; no crea una cuenta en línea. Consérvala: EduMoney no puede recuperarla. Guarda respaldos porque borrar los datos del navegador elimina la copia local.</Body>
      <Field label="Contraseña local" testID="web-password" secure value={password} onChangeText={setPassword}/>
      {exists === false ? <Field label="Repetir contraseña local" testID="web-password-repeat" secure value={repeat} onChangeText={setRepeat}/> : null}
      {error ? <View accessibilityRole="alert"><Body>{error}</Body></View> : null}
      {exists === undefined && error ? <ActionButton title="Reintentar apertura" onPress={() => window.location.reload()}/> : busy || exists === undefined ? <ActivityIndicator accessibilityLabel="Preparando espacio cifrado"/> : <ActionButton title={exists ? 'Desbloquear' : 'Crear espacio local'} testID="web-unlock" onPress={() => void open()}/>}
    </Card>
  </View></ScrollView>;
}
