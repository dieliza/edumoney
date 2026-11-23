/**
 * Estimates 2026 PR service withholding independently of actual amounts.
 * Hacienda 480.6SP Rev. 06.26, page 2, and Code §1062.03.
 */
export const SERVICE_WITHHOLDING_SOURCE_2026 =
  'https://hacienda.pr.gov/sites/default/files/documentos/480.6sp_2026_informativo.pdf#page=2';
type Facts = {
  calendarYear: number;
  // One payer, one payee, paid (not invoiced), chronological totals.
  payerPayeeAndPaymentOrderConfirmed: boolean;
  previouslyPaidCents: number | null;
  currentPaymentCents: number | null;
  treatment: 'general-confirmed' | 'exemption-confirmed' | 'optional-6-confirmed' | 'unresolved';
};

export function estimateServiceWithholding(f: Facts): { amountCents: number | null; reason: string } {
  if (f.calendarYear !== 2026) return {amountCents:null,reason:'Regla de estimación aún no verificada para este año.'};
  if (!f.payerPayeeAndPaymentOrderConfirmed || f.previouslyPaidCents === null || f.currentPaymentCents === null ||
    !Number.isSafeInteger(f.previouslyPaidCents) || !Number.isSafeInteger(f.currentPaymentCents) ||
    f.previouslyPaidCents < 0 || f.currentPaymentCents < 0 || f.treatment === 'unresolved') {
    return {amountCents:null,reason:'Confirma el pagador, los pagos del año y si hay relevo o excepción antes de estimar.'};
  }
  if (f.treatment === 'exemption-confirmed') return {amountCents:0,reason:'Exención total confirmada por el usuario; conserva la retención informada.'};
  if (!['general-confirmed','optional-6-confirmed'].includes(f.treatment)) return {amountCents:null,reason:'Tratamiento no validado.'};
  const exemptRemaining = Math.max(0,50_000 - f.previouslyPaidCents);
  const applicable = BigInt(Math.max(0,f.currentPaymentCents - exemptRemaining));
  const rate = f.treatment === 'optional-6-confirmed' ? 6n : 10n;
  return {amountCents:Number((applicable * rate + 50n) / 100n),reason:'Estimación del exceso aplicable; no sustituye la cantidad del comprobante.'};
}
