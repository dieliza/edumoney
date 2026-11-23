import { describe, expect, it } from 'vitest';
import { estimateServiceWithholding } from '../src/modules/planilla/service-withholding';

const facts = { calendarYear:2026, payerPayeeAndPaymentOrderConfirmed:true, previouslyPaidCents:40_000, currentPaymentCents:30_000, treatment:'general-confirmed' as const };
describe('2026 services withholding estimate, not posted to ledger', () => {
  it('applies 10% only above the confirmed payer-to-payee threshold', () => {
    expect(estimateServiceWithholding(facts).amountCents).toBe(2_000);
    expect(estimateServiceWithholding({...facts,previouslyPaidCents:0}).amountCents).toBe(0);
    expect(estimateServiceWithholding({...facts,currentPaymentCents:10_000}).amountCents).toBe(0);
  });
  it('does not reuse the year, guess treatment, payer or zero paid', () => {
    expect(estimateServiceWithholding({...facts,calendarYear:2025}).amountCents).toBeNull();
    expect(estimateServiceWithholding({...facts,previouslyPaidCents:null}).amountCents).toBeNull();
    expect(estimateServiceWithholding({...facts,payerPayeeAndPaymentOrderConfirmed:false}).amountCents).toBeNull();
    expect(estimateServiceWithholding({...facts,treatment:'unresolved'}).amountCents).toBeNull();
  });
});
