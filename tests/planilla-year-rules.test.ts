import { describe, expect, it } from 'vitest';
import {
  estimateWorkCredit,
  TAX_YEAR_RULES,
  type WorkCreditInput,
} from '../src/modules/planilla/year-rules';

function example(changes: Partial<WorkCreditInput> = {}): WorkCreditInput {
  return {
    taxYear: 2025,
    filingStatus: 'individual',
    eligibility: {
      prResidencyAllYearAndAtFiling: true,
      validIdentificationByDueDate: true,
      earnedIncomeRequirementMet: true,
      taxpayerAndApplicableSpouseAge19Plus: true,
      taxpayerAndApplicableSpouseNotClaimedAsDependents: true,
      doesNotClaimIncompatibleCredits: true,
      timelyFilingIncludingExtension: true,
      taxpayerAliveAtFiling: true,
      specialCasesReviewed: true,
    },
    earnedIncome: { cents: 1_000_000, verified: true },
    otherIncome: { cents: 0, verified: true },
    qualifiedDependents: { count: 0, verified: true },
    ...changes,
  };
}

describe('2025 CT informational estimate', () => {
  it('does not reuse the prior year’s rule set for 2026', () => {
    expect(estimateWorkCredit(example({ taxYear: 2026 }))).toEqual({
      status: 'blocked', reason: 'unsupported-year', filingReady: false,
    });
    expect(TAX_YEAR_RULES[2026].form482.status).toBe('official-version-not-verified');
    expect(TAX_YEAR_RULES[2026].workCredit.status).toBe('official-version-not-verified');
  });

  it('requires affirmative evidence and never estimates from raw or unverified figures', () => {
    expect(estimateWorkCredit(example({ eligibility: {} }))).toMatchObject({ reason: 'special-cases-need-review' });
    const base = example();
    expect(estimateWorkCredit(example({ eligibility: { ...base.eligibility, prResidencyAllYearAndAtFiling: null } })))
      .toMatchObject({ status: 'blocked', reason: 'eligibility-not-confirmed', condition: 'prResidencyAllYearAndAtFiling' });
    expect(estimateWorkCredit(example({ eligibility: { ...base.eligibility, timelyFilingIncludingExtension: false } })))
      .toMatchObject({ status: 'ineligible', condition: 'timelyFilingIncludingExtension' });
    expect(estimateWorkCredit(example({ earnedIncome: { cents: 1_000_000, verified: false } })))
      .toMatchObject({ status: 'blocked', reason: 'earned-income-not-verified' });
    expect(estimateWorkCredit(example({ otherIncome: { cents: null, verified: true } })))
      .toMatchObject({ status: 'blocked', reason: 'other-income-not-verified' });
    expect(estimateWorkCredit(example({ qualifiedDependents: { count: 0, verified: false } })))
      .toMatchObject({ status: 'blocked', reason: 'dependents-not-verified' });
  });

  it('keeps the discrepancy at precisely $10,000 separate from the adjacent valid rule', () => {
    expect(estimateWorkCredit(example({ otherIncome: { cents: 999_999, verified: true } })))
      .toMatchObject({ status: 'estimated', creditCents: 150_000, filingReady: false });
    expect(estimateWorkCredit(example({ otherIncome: { cents: 1_000_000, verified: true } })))
      .toMatchObject({ status: 'blocked', reason: 'other-income-exact-limit-review' });
    expect(estimateWorkCredit(example({ otherIncome: { cents: 1_000_001, verified: true } })))
      .toMatchObject({ status: 'ineligible', reason: 'other-income-above-limit' });
  });

  it('uses the statutory income tiers for 0, 1, 2, or 3+ verified dependents', () => {
    const expectedCents = [150_000, 339_800, 400_000, 448_300, 448_300];
    expect(expectedCents.map((_, count) =>
      estimateWorkCredit(example({ qualifiedDependents: { count, verified: true } }))))
      .toEqual(expectedCents.map(creditCents => ({ status: 'estimated', taxYear: 2025, creditCents, filingReady: false })));
  });

  it('uses the joint threshold for living spouses but the individual threshold for a verified surviving spouse with CO', () => {
    const amounts = { earnedIncome: { cents: 2_000_000, verified: true } };
    expect(estimateWorkCredit(example({ ...amounts, filingStatus: 'joint' })))
      .toMatchObject({ status: 'estimated', creditCents: 179_400 });
    expect(estimateWorkCredit(example({ ...amounts, filingStatus: 'surviving-spouse-with-optional-computation' })))
      .toMatchObject({ status: 'estimated', creditCents: 166_350 });
    expect(estimateWorkCredit(example({ filingStatus: 'married-separate' })))
      .toMatchObject({ status: 'ineligible', reason: 'married-separate' });
  });

  it('checks the official maximum boundary, not an algebraically derived breakpoint', () => {
    expect(estimateWorkCredit(example({ earnedIncome: { cents: 3_109_000, verified: true } })))
      .toMatchObject({ status: 'estimated', creditCents: 0 });
    expect(estimateWorkCredit(example({ earnedIncome: { cents: 3_109_001, verified: true } })))
      .toMatchObject({ status: 'ineligible', reason: 'earned-income-above-limit' });
  });

  it('separates the 2026 issuer/form metadata from the individual return', () => {
    const { forms } = TAX_YEAR_RULES[2026].informationReturns;
    expect(forms['480.6G']).toMatchObject({ replaces4806SP: false, dueDate: '2027-03-01' });
    expect(forms['480.6SP.2'].dueDate).toBe('2027-03-01');
    expect(forms['480.7E']).toMatchObject({ bankAndProcessingFeesBox: 6, optional: true });
    expect(forms['480.7F'].bankAndProcessingFeesBox).toBe(7);
  });
});
