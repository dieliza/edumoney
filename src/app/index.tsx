import { fixed } from '../design/tokens';
import { router } from 'expo-router';
import { View } from 'react-native';
import { useTheme } from '../design/ThemeProvider';
import { ActionButton, Body, Card, IconBadge, Screen } from '../ui/components';
import { isPreview } from '../modules/money/localStore';
import { Brand } from '../ui/Brand';
export default function Welcome() {
  const { name, colors } = useTheme();
  return <Screen title="EduMoney" welcome>
    <View style={{ paddingVertical: 12, gap: 24, alignItems: 'center' }}>
      <View style={{ width: '100%', alignItems: 'center', gap: 18, paddingVertical: 12 }}>
        <Brand large onDark={name === 'dark'}/>
        <Body style={{ textAlign: 'center', fontSize: 20, lineHeight: 28, color: name === 'dark' ? fixed.white : colors.text }}>Toma el control de tu dinero con decisiones informadas</Body>
      </View>
      <View style={{ width: '100%', gap: 14 }}>
        <ActionButton testID="enter-demo" title={isPreview ? "Explorar demostración" : "Abrir Mi dinero"} icon="arrow-forward" onPress={() => router.replace('/(tabs)/money')} />
        <Body style={{ textAlign: 'center', color: name === 'dark' ? fixed.welcomeMutedDark : colors.muted, fontSize: 14 }}>{isPreview ? "Vista preliminar con datos ficticios. No necesitas crear una cuenta." : "Registra tu dinero y tu negocio en este dispositivo, sin crear una cuenta."}</Body>
      </View>
      <Card style={{ width: '100%', gap: 18 }}>
        <Body style={{ fontSize: 19, fontWeight: '700' }}>Tu tranquilidad va primero</Body>
        {([
          ['shield-checkmark-outline', 'Privado y seguro', 'Tu información permanece en tu dispositivo.'],
          ['cloud-offline-outline', 'Sin nube', 'Tú decides qué compartir y cuándo.'],
          ['book-outline', 'Sin inteligencia artificial', 'Decisiones informadas, con explicaciones claras.'],
        ] as const).map(([icon, title, detail]) => <View key={title} style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}><IconBadge icon={icon} size={42} />
          <View style={{ flex: 1 }}><Body style={{ fontWeight: '700', fontSize: 15 }}>{title}</Body><Body muted style={{ fontSize: 13, lineHeight: 20 }}>{detail}</Body></View>
        </View>)}
      </Card>
    </View>
  </Screen>;
}
