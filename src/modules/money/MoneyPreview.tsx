import { fixed } from '../../design/tokens';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ExpenseDonut } from '../../ui/ExpenseDonut';
import { parseAmount } from '../../core/money';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../design/ThemeProvider';
import { ActionButton, Body, Card, DashboardAction, IconBadge, Screen, SectionHeading, ui } from '../../ui/components';
import { bills, expenses } from '../../preview/data';
import { PreviewModal } from '../../preview/PreviewModal';
const segments = ['Resumen', 'Transacciones', 'Categorías'] as const;
export default function Money() {
  const { colors } = useTheme();
  const [segment, setSegment] = useState<typeof segments[number]>('Resumen');
  const [detail, setDetail] = useState<string | null>(null);
  return <Screen title="Mi dinero" subtitle="¡Hola! Cada decisión cuenta para tu tranquilidad.">
    <View accessibilityRole="tablist" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, padding: 6, backgroundColor: colors.surfaceAlt, borderRadius: 16 }}>
      {segments.map(item => <Pressable key={item} accessibilityRole="tab" accessibilityState={{ selected: item === segment }} onPress={() => setSegment(item)} style={{ flexGrow: 1, padding: 12, minHeight: 46, borderRadius: 12, backgroundColor: item === segment ? colors.primary : 'transparent' }}><Text style={{ color: item === segment ? fixed.white : colors.text, textAlign: 'center', fontSize: 13, fontWeight: '700' }}>{item}</Text></Pressable>)}
    </View>
    {segment === 'Resumen' ? <>
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <LinearGradient colors={[colors.mint, colors.blue]} style={{ padding: 22, gap: 6 }}>
          <View style={ui.between}><Body style={{ fontWeight: '600' }}>Disponible estimado</Body><Ionicons name="eye-outline" size={23} color={colors.primary} /></View>
          <Text style={{ color: fixed.balance, fontSize: 38, fontWeight: '800', letterSpacing: -1 }}>$1,245.32</Text>
          <Body muted style={ui.small}>Ejemplo · No es un saldo bancario confirmado</Body>
        </LinearGradient>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, paddingBottom: 20, gap: 18 }}>
          <View style={[ui.row, { flex: 1, minWidth: 125 }]}><Ionicons name="arrow-up-circle" color={fixed.income} size={29} /><View><Body muted style={ui.small}>Ingresos</Body><Body style={{ fontWeight: '700' }}>$3,200.00</Body></View></View>
          <View style={[ui.row, { flex: 1, minWidth: 125 }]}><Ionicons name="arrow-down-circle" color={fixed.expense} size={29} /><View><Body muted style={ui.small}>Gastos</Body><Body style={{ fontWeight: '700' }}>$1,954.68</Body></View></View>
        </View>
      </Card>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {([
          ['Añadir ingreso', 'add-circle-outline', 'mint'], ['Registrar gasto', 'receipt-outline', 'coral'],
          ['Escanear recibo', 'camera-outline', 'blue'], ['Ordenar mis pagos', 'calendar-outline', 'violet'],
        ] as const).map(([title, icon, tone]) => <DashboardAction key={title} title={title} icon={icon} tone={tone} onPress={() => setDetail(title)}/>)}
      </View>
      <SectionHeading title="Próximas facturas" action="Ver todas" onPress={() => setDetail('Mis facturas')} />
      <Card>{bills.slice(0, 2).map((bill, index) => <View key={bill.title} style={[ui.row, { paddingBottom: index === 0 ? 16 : 0, borderBottomWidth: index === 0 ? 1 : 0, borderBottomColor: colors.line }]}>
        <IconBadge icon={bill.icon} tone={bill.tone} size={42} /><View style={{ flex: 1 }}><Body style={{ fontWeight: '700' }}>{bill.title}</Body><Body muted style={ui.small}>{bill.description}</Body></View>
        <View style={{ alignItems: 'flex-end', maxWidth: '40%' }}><Body muted style={{ fontSize: 12 }}>{bill.date}</Body><Body style={{ fontWeight: '700' }}>{bill.amount}</Body></View>
      </View>)}</Card>
      <SectionHeading title="Así se distribuyen tus gastos" />
      <Card>
        <ExpenseDonut total={195468} items={expenses.map(item => ({ id: item.name, name: item.name, spent: parseAmount(item.amount.replace('$', '')) }))}/>

      </Card>
      <ActionButton secondary title="Para mi contable" icon="document-text-outline" onPress={() => setDetail('Para mi contable')} />
    </> : segment === 'Transacciones' ? <Card><Body style={ui.heading}>Movimientos de ejemplo</Body>
      {[['Ingreso mensual', '+ $3,200.00'], ['Compra de alimentos', '− $55.00'], ['Electricidad', '− $125.00']].map(([title, amount]) => <View key={title} style={ui.between}><Body style={{ flex: 1 }}>{title}</Body><Body style={{ fontWeight: '700' }}>{amount}</Body></View>)}
      <Body muted style={ui.small}>Ejemplos ilustrativos. No forman un historial real ni modifican el resumen.</Body>
    </Card> : <Card><Body style={ui.heading}>Categorías de ejemplo</Body>{expenses.map(item => <View key={item.name} style={ui.row}><View style={{ width: 10, height: 10, backgroundColor: item.color, borderRadius: 5 }} /><Body>{item.name}</Body></View>)}</Card>}
    <PreviewModal title={detail} close={() => setDetail(null)} />
  </Screen>;
}
