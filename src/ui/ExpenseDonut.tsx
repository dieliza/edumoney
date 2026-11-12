import { Pressable, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Body, ui } from './components';
import { formatMoney } from '../modules/money/domain';

import { expenseSegments, type ExpenseSlice } from './expenseSegments';
export function ExpenseDonut({ items, total, onSelect }: { items: readonly ExpenseSlice[]; total: number; onSelect?(id: string): void }) {
  const segments = expenseSegments(items);
  if (!segments.length) return <Body muted>Aún no hay gastos registrados en este mes. La gráfica aparecerá cuando registres el primero.</Body>;
  const circumference = 2 * Math.PI * 78;
  return <View style={{ gap: 14 }}>
    <View accessible accessibilityLabel={`Gastos: ${formatMoney(total)}. Desglose por categoría a continuación.`} style={{ alignItems: 'center', justifyContent: 'center', height: 212 }}>
      <Svg width={212} height={212} viewBox="0 0 212 212" aria-hidden>
        {segments.map(item => <Circle key={item.id} cx={106} cy={106} r={78} fill="none" stroke={item.color} strokeWidth={28} strokeDasharray={`${circumference * item.fraction} ${circumference}`} strokeDashoffset={-circumference * item.offset} transform="rotate(-90 106 106)"/>)}
      </Svg>
      <View pointerEvents="none" style={{ position: 'absolute', alignItems: 'center', maxWidth: 130 }}><Body muted style={ui.small}>Gastos</Body><Body style={{ fontSize: 20, fontWeight: '800', textAlign: 'center' }}>{formatMoney(total)}</Body></View>
    </View>
    {segments.map(item => {
      const content = <View style={[ui.row, { minHeight: 48 }]}><View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: item.color }}/><Body style={{ flex: 1, fontSize: 14 }}>{item.name}</Body><Body muted style={ui.small}>{Math.round(item.fraction * 1000) / 10}%</Body><Body style={{ fontWeight: '700', fontSize: 14 }}>{formatMoney(item.spent)}</Body></View>;
      return onSelect ? <Pressable key={item.id} accessibilityRole="button" accessibilityLabel={`Ver gastos de ${item.name}, ${formatMoney(item.spent)}`} onPress={() => onSelect(item.id)}>{content}</Pressable> : <View key={item.id}>{content}</View>;
    })}
  </View>;
}
