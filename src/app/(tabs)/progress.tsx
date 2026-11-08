import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Body, Card, IconBadge, ProgressBar, Screen, ui } from '../../ui/components';
export default function Progress() {
  return <Screen title="Mi progreso" subtitle="Los pequeños hábitos hacen grandes cambios.">
    <LinearGradient colors={['#008461', '#006458']} style={{ borderRadius: 24, padding: 24, gap: 14 }}>
      <Ionicons name="trophy-outline" color="#FFE18B" size={42} />
      <Body style={{ color: '#FFFFFF', fontSize: 23, fontWeight: '700' }}>¡Vas por buen camino!</Body>
      <Body style={{ color: '#F0FFF9' }}>Así podrías visualizar tus avances. Estos reconocimientos son ejemplos.</Body>
    </LinearGradient>
    {([
      ['Movimientos registrados', '32 en este mes de ejemplo', 'bar-chart-outline', 'mint'],
      ['Gastos bajo control', '14% menos en este ejemplo', 'trending-down-outline', 'blue'],
      ['Facturas al día', '4 de 5 atendidas en el ejemplo', 'checkmark-circle-outline', 'mint'],
      ['Meta en progreso', 'Fondo de emergencia · 28% de ejemplo', 'flag-outline', 'violet'],
    ] as const).map(([title, detail, icon, tone]) => <Card key={title}><View style={ui.row}><IconBadge icon={icon} tone={tone} /><View style={{ flex: 1, gap: 4 }}><Body style={{ fontWeight: '700' }}>{title}</Body><Body muted style={{ fontSize: 14, lineHeight: 21 }}>{detail}</Body></View></View></Card>)}
    <Card><Body style={ui.heading}>Un paso a la vez</Body><Body muted>Tu plan de 90 días · vista de ejemplo</Body><ProgressBar value={20} label="Plan de ejemplo: 20 por ciento" /><Body style={{ fontSize: 14 }}>Cada avance cuenta. Empieza a tu ritmo.</Body></Card>
  </Screen>;
}
