/** Digits entered from the right represent cents. Never uses binary floating point. */
export function moneyKeystroke(text: string): string {
  const digits = text.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
  if (!digits) return '';
  if (digits.length > 15) return ''; // Financial validation also enforces the safe integer range.
  const padded = digits.padStart(3, '0');
  return `${text.trim().startsWith('-') ? '-' : ''}${padded.slice(0,-2)}.${padded.slice(-2)}`;
}
export function moneyDisplay(value: string): string {
  if (!/^-?\d+(\.\d{0,2})?$/.test(value)) return value;
  const [whole, fraction=''] = value.split('.'); return `${whole}.${fraction.padEnd(2,'0')}`;
}
