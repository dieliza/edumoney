/** Puerto Rico annual tax-prep references, not a filing or tax-balance engine. */
const FORM_482_2025 = 'https://hacienda.pr.gov/node/5770';
const CT_ES_2025 = 'https://hacienda.pr.gov/sites/default/files/anejo_ct_rev._20_jun_25-informativo.pdf';
const CT_EN_2025 = 'https://hacienda.pr.gov/sites/default/files/schedule_ct_rev._jul_18_25-informative.pdf';
const BI_CT_2025 = 'https://hacienda.pr.gov/publicaciones/boletin-informativo-de-rentas-internas-num-26-01-bi-ri-26-01';
const CC_CT_ELIGIBILITY = 'https://hacienda.pr.gov/publicaciones/carta-circular-de-rentas-internas-num-22-02-cc-ri-22-02';
const BI_INFORMATIVAS_2026 = 'https://hacienda.pr.gov/publicaciones/boletin-informativo-de-rentas-internas-num-26-06-bi-ri-26-06';
const BI_INFORMATIVAS_2026_PDF = 'https://hacienda.pr.gov/sites/default/files/publicaciones/2026/11/bi_ri_26-06_w-2pr_y_declaraciones_informativas_ano_contributivo_2026_signed.pdf';

export const TAX_YEAR_RULES = {
  2025: {
    form482: {
      status: 'informational-not-for-filing',
      source: FORM_482_2025,
      instructions: 'https://hacienda.pr.gov/sites/default/files/inst_individuos_2025_1_abr_26.pdf',
    },
    workCredit: {
      status: 'informational-estimate-only',
      formLine: 'Formulario 482, Encasillado 3, línea 27C',
      sources: [CT_ES_2025, CT_EN_2025, BI_CT_2025, CC_CT_ELIGIBILITY],
    },
  },
  2026: {
    form482: { status: 'official-version-not-verified' },
    workCredit: { status: 'official-version-not-verified' },
    informationReturns: {
      source: BI_INFORMATIVAS_2026,
      signedSource: BI_INFORMATIVAS_2026_PDF,
      signedDate: '2026-11-10',
      listedDate: '2026-11-12',
      scope: 'Comprobantes de Retención y Declaraciones Informativas, no Formulario 482 ni Anejo CT.',
      filingChannel: 'electronic-suri',
      copiesAfterDeadlineCalendarDays: 7,
      forms: {
        '499R-2/W-2PR': { dueDate: '2027-02-01' },
        '480.6D': { excludedGrossIncomeBox:23, exemptSubjectToAlternateBasicTaxBox:21, exemptNotSubjectBox:22 },
        '480.7B': { educationContributionBox:2, issuerReportCapCents:100_000 },
        '480.7C': { annuityCode:'M', annuityCodeFor:'fixed-or-variable-annuity', distributionBox:16, taxableAmountBox:17 },
        '480.7G': { studentLoansCountAsFinancialAid:false, eligibleEducationBox:4, financialAidBox:5 },
        '480.7H': { newForTaxYear:true, type:'ABLE', annualContributionCapCents:500_000, additionalGuidancePendingAtBulletinPublication:true },
        '480.6G': {
          dueDate: '2027-03-01',
          replaces4806SP: false,
          reconciliation: 'Confirmar duplicados y partidas reportables no informadas en otra declaración; no sumar automáticamente.',
        },
        '480.6SP': {
          dueDate: '2027-03-01',
          source: 'https://hacienda.pr.gov/sites/default/files/documentos/480.6sp_2026_informativo.pdf',
        },
        '480.6SP.2': { dueDate: '2027-03-01' },
        '480.7E': {
          dueDate: 'related-return-deadline-including-extensions',
          optional: true,
          bankAndProcessingFeesBox: 6,
          otherRelatedPaymentsBox: 7,
        },
        '480.7F': {
          dueDate: '2027-03-01',
          bankAndProcessingFeesBox: 7,
          otherRelatedPaymentsBox: 8,
        },
      },
    },
  },
} as const;

const CENTS_PER_DOLLAR = 100;
const BASIS_POINTS = 10_000;
const OTHER_INCOME_LIMIT_CENTS = 10_000 * CENTS_PER_DOLLAR;

/** CT 2025 Part II line 5 and Part III lines A–D. Threshold values are US dollars, not inferred from percentages. */
export const WORK_CREDIT_2025_BANDS = [
  { entryBps: 1500, cap: 1794, reductionBps: 1500, individual: [19130, 31090], joint: [21530, 33490] },
  { entryBps: 3398, cap: 4186, reductionBps: 2692, individual: [21530, 37081], joint: [26310, 41861] },
  { entryBps: 4000, cap: 6576, reductionBps: 3438, individual: [25110, 44237], joint: [29900, 49027] },
  { entryBps: 4483, cap: 7774, reductionBps: 3421, individual: [25110, 47833], joint: [29900, 52623] },
] as const;

type Answer = true | false | null;
export const WORK_CREDIT_ELIGIBILITY_KEYS = [
  'prResidencyAllYearAndAtFiling',
  'validIdentificationByDueDate',
  'earnedIncomeRequirementMet',
  'taxpayerAndApplicableSpouseAge19Plus',
  'taxpayerAndApplicableSpouseNotClaimedAsDependents',
  'doesNotClaimIncompatibleCredits',
  'timelyFilingIncludingExtension',
  'taxpayerAliveAtFiling',
  'specialCasesReviewed',
] as const;
type EligibilityKey = (typeof WORK_CREDIT_ELIGIBILITY_KEYS)[number];

type VerifiedAmount = { cents: number | null; verified: boolean };
export type WorkCreditInput = {
  taxYear: number;
  filingStatus: 'individual' | 'joint' | 'married-separate' | 'surviving-spouse-with-optional-computation' | 'uncertain';
  eligibility: Partial<Record<EligibilityKey, Answer>>;
  /**
   * Verified CT Part II line 1D only. Not deposits, bank cash flow, gross sales, or general ledger totals.
   * For a surviving spouse with optional computation, this must be their eligible income only.
   * For eligible self-employment use the applicable J/K/L/M items and attest all requirements
   * (including active merchant registration, federal Social Security applicability and qualifying reports).
   */
  earnedIncome: VerifiedAmount;
  /** Verified CT Part II line 2D after applicable adjustments; explicit zero is allowed. */
  otherIncome: VerifiedAmount;
  /** Verified A1 count restricted to CT-qualified dependents. */
  qualifiedDependents: { count: number | null; verified: boolean };
};

type WorkCreditBlockedReason =
  | 'unsupported-year'
  | 'unconfirmed-filing-status'
  | 'eligibility-not-confirmed'
  | 'special-cases-need-review'
  | 'earned-income-not-verified'
  | 'other-income-not-verified'
  | 'dependents-not-verified'
  | 'other-income-exact-limit-review';
type WorkCreditIneligibleReason =
  | 'married-separate'
  | 'eligibility-requirement-not-met'
  | 'no-earned-income'
  | 'other-income-above-limit'
  | 'earned-income-above-limit';

export type WorkCreditResult =
  | { status: 'estimated'; taxYear: 2025; creditCents: number; filingReady: false }
  | { status: 'blocked'; reason: WorkCreditBlockedReason; filingReady: false; condition?: EligibilityKey }
  | { status: 'ineligible'; reason: WorkCreditIneligibleReason; filingReady: false; condition?: EligibilityKey };

const blocked = (reason: WorkCreditBlockedReason, condition?: EligibilityKey): WorkCreditResult =>
  ({ status: 'blocked', reason, filingReady: false, ...(condition ? { condition } : {}) });
const ineligible = (reason: WorkCreditIneligibleReason, condition?: EligibilityKey): WorkCreditResult =>
  ({ status: 'ineligible', reason, filingReady: false, ...(condition ? { condition } : {}) });

function isVerifiedAmount(amount: VerifiedAmount): amount is { cents: number; verified: true } {
  return amount?.verified === true && typeof amount.cents === 'number'
    && Number.isSafeInteger(amount.cents) && amount.cents >= 0;
}

export function estimateWorkCredit(input: WorkCreditInput): WorkCreditResult {
  if (input.taxYear !== 2025) return blocked('unsupported-year');
  if (input.filingStatus === 'married-separate') return ineligible('married-separate');
  if (input.filingStatus !== 'individual' && input.filingStatus !== 'joint'
      && input.filingStatus !== 'surviving-spouse-with-optional-computation') return blocked('unconfirmed-filing-status');

  if (input.eligibility?.specialCasesReviewed !== true) return blocked('special-cases-need-review', 'specialCasesReviewed');
  for (const condition of WORK_CREDIT_ELIGIBILITY_KEYS) {
    const answer = input.eligibility[condition];
    if (answer === false) return ineligible('eligibility-requirement-not-met', condition);
    if (answer !== true) return blocked('eligibility-not-confirmed', condition);
  }

  if (!isVerifiedAmount(input.earnedIncome)) return blocked('earned-income-not-verified');
  if (!isVerifiedAmount(input.otherIncome)) return blocked('other-income-not-verified');
  const dependents = input.qualifiedDependents?.count;
  if (input.qualifiedDependents?.verified !== true || typeof dependents !== 'number'
      || !Number.isSafeInteger(dependents) || dependents < 0) return blocked('dependents-not-verified');

  const earned = input.earnedIncome.cents;
  const other = input.otherIncome.cents;
  if (earned === 0) return ineligible('no-earned-income');
  if (other > OTHER_INCOME_LIMIT_CENTS) return ineligible('other-income-above-limit');
  // EN line 3, ES line 2D and both sets of instructions say “above $10,000”. ES line 3's last
  // sentence instead bars exactly $10,000. Do not autoresolve this disputed display boundary.
  if (other === OTHER_INCOME_LIMIT_CENTS) return blocked('other-income-exact-limit-review');

  const band = WORK_CREDIT_2025_BANDS[Math.min(dependents, 3)];
  const [starts, upper] = band[input.filingStatus === 'joint' ? 'joint' : 'individual'];
  if (earned > upper * CENTS_PER_DOLLAR) return ineligible('earned-income-above-limit');

  const cap = band.cap * CENTS_PER_DOLLAR;
  const start = starts * CENTS_PER_DOLLAR;
  // Round only the final estimated amount to cents. Do not imply Form 482/SURI reporting precision.
  const scaled = earned <= start
    ? Math.min(cap * BASIS_POINTS, earned * band.entryBps)
    : Math.max(0, cap * BASIS_POINTS - (earned - start) * band.reductionBps);
  const creditCents = Math.floor((scaled + BASIS_POINTS / 2) / BASIS_POINTS);
  return { status: 'estimated', taxYear: 2025, creditCents, filingReady: false };
}
