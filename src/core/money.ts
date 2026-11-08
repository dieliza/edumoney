/** USD/centavos: nunca almacenar importes financieros como float. */
export type Cents = number & { readonly __cents: unique symbol };
export function cents(value: number): Cents {
  if (!Number.isSafeInteger(value)) throw new Error('Importe fuera de rango o fraccionario');
  return value as Cents;
}
export function parseAmount(value: string): Cents {
  if (!/^-?\d+(?:\.\d{1,2})?$/.test(value)) throw new Error('Usa un importe decimal con hasta dos decimales');
  const negative = value.startsWith('-');
  const [whole, fraction = ''] = value.replace('-', '').split('.');
  const result = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'));
  return cents(Number(negative ? -result : result));
}
export function addAmounts(...values: Cents[]): Cents {
  return cents(Number(values.reduce((sum, value) => sum + BigInt(value), 0n)));
}
