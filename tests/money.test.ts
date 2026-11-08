import { describe, it, expect } from 'vitest';
import { cents, parseAmount, addAmounts } from '../src/core/money';
describe('Dinero decimal', () => {
  it('suma centavos exactamente', () => expect(addAmounts(parseAmount('0.10'), parseAmount('0.20'))).toBe(30));
  it('interpreta negativos y fracciones', () => { expect(parseAmount('-12.3')).toBe(-1230); expect(parseAmount('0')).toBe(0); });
  it.each(['1.001', 'NaN', '1e3', '', '1,000', '90071992547409.92'])('rechaza %s', value => expect(() => parseAmount(value)).toThrow());
  it('rechaza overflow de sumas y fracciones binarias', () => {
    expect(() => addAmounts(cents(Number.MAX_SAFE_INTEGER), cents(1))).toThrow();
    expect(() => cents(0.1)).toThrow();
  });
});
