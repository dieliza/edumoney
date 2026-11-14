import {categoryAppearance} from './categoryAppearance';
export type ExpenseSlice = { id: string; name: string; spent: number };

/** El gráfico representa centavos registrados, sin datos de relleno. */
export function expenseSegments(items: readonly ExpenseSlice[]) {
  const positive = items.filter(item => Number.isSafeInteger(item.spent) && item.spent > 0);
  const total = positive.reduce((sum, item) => sum + BigInt(item.spent), 0n);
  let previous = 0n;
  return positive.map(item => {
    const fraction = Number(BigInt(item.spent) * 1000000n / total) / 1000000;
    const offset = Number(previous * 1000000n / total) / 1000000;
    previous += BigInt(item.spent);
    return { ...item, fraction, offset, color: categoryAppearance(item.id,item.name).color };
  });
}
