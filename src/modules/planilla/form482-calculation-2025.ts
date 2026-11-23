/**
 * Arithmetic draft only, Formulario 482 (2025), ordinary table for an individual
 * full-year resident. No annex is calculated here; no SURI filing/compliance claim.
 *
 * Hacienda instructions, rev. 1 abr 2026, pp. 19–22 (personal/dependent
 * exemptions, table, gradual adjustment, line 17 and final comparison):
 * https://hacienda.pr.gov/sites/default/files/inst_individuos_2025_1_abr_26.pdf
 * Official informational original, pp. 2–3 (line relationships / unit):
 * https://hacienda.pr.gov/sites/default/files/individuos_2025_rev._20_jun_25_informativo.pdf
 * PR Internal Revenue Code §1061.19 permits excluding fractional dollars in
 * return entries and arithmetic. The form prints .00; the individual booklet
 * does not specify SURI rounding order. Input must be already verified whole
 * dollars; the two computed percentages below discard fractional dollars at
 * each line for internal consistency of this draft and report where that
 * happens. No claim that this exactly reproduces SURI or certified software.
 * https://hacienda.pr.gov/sites/default/files/1-2011.pdf
 */
export const FORM482_CONFIRMED_DOLLAR_FIELDS_2025 = [
  '5', '6', '8A', '8B', '9', '12', '18', '20', '21', '24', '25',
  '27A', '27B', '27C', '27D', '27E', '30', 'grossFor17',
] as const;
export type Form482ConfirmedField2025 = typeof FORM482_CONFIRMED_DOLLAR_FIELDS_2025[number];
export type Form482Line2025 = Exclude<Form482ConfirmedField2025, 'grossFor17'>
  | '7' | '8C' | '10' | '11' | '13' | '14' | '15' | '16' | '17' | '19' | '22'
  | '23' | '26' | '27F' | '28' | '29' | '31';
type PendingLine = Form482Line2025 | 'grossFor17' | 'scope';
type PendingReason = 'unsupported-year' | 'unconfirmed-scope' | 'unsupported-method'
  | 'unsupported-input' | 'unconfirmed-input' | 'invalid-whole-dollar-input'
  | 'invalid-confirmed-exemption' | 'gradual-adjustment-required'
  | 'incompatible-alternative-tax-lines' | 'credit-exceeds-regular-tax'
  | 'credit-exceeds-alternative-maximum' | 'private-capital-exceeds-maximum'
  | 'missing-dependency' | 'outside-safe-range';
export type Form482Input2025 = {
  taxYear: number;
  fullYearResident: boolean | null;
  filingStatus: string | null;
  method: string | null;
  /** Explicit review of applicability of oval 1 and cases outside this draft.
   * Anejos and credits must be separately validated, including any required
   * Anejo O. False/unknown never implies they do not apply.
   */
  casesReviewed: boolean | null;
  /** Form-ready USD, unrounded source cents must remain intact elsewhere.
   * Line 5 = already confirmed gross adjusted income; grossFor17 = distinct
   * gross threshold basis in the instructions for line 17. Neither is taken
   * from bookkeeping deposits. All zeros represent explicit confirmation.
   * Lines 8A/8B are verified exemption dollar amounts, not dependent counts.
   */
  confirmedDollars?: Partial<Record<Form482ConfirmedField2025, number | null>>;
};
export type Form482Result2025 = {
  taxYear: number;
  lines: Partial<Record<Form482Line2025, number>>;
  pending: {line: PendingLine; reason: PendingReason}[];
  balance: {type: 'payment' | 'overpayment' | 'zero'; dollars: number} | null;
  method: 'regular-table';
  line14Oval: 1 | null;
  line17Oval: 1 | 2 | null;
  line17Percent: 95 | 92 | null;
  truncatedLines: ('14' | '17')[];
  filingReady: false;
};

const MAX = BigInt(Number.MAX_SAFE_INTEGER);
const fields = new Set<string>(FORM482_CONFIRMED_DOLLAR_FIELDS_2025);
const nonnegative = (n: bigint) => n < 0n ? 0n : n;
const tableHundredths = (net: bigint) => {
  if (net <= 9_000n) return 0n;
  if (net <= 25_000n) return (net - 9_000n) * 7n;
  if (net <= 41_500n) return 112_000n + (net - 25_000n) * 14n;
  if (net <= 61_500n) return 343_000n + (net - 41_500n) * 25n;
  return 843_000n + (net - 61_500n) * 33n;
};

export function calculateForm4822025(input: Form482Input2025): Form482Result2025 {
  const result: Form482Result2025 = {
    taxYear: input.taxYear, lines: {}, pending: [], balance: null, method: 'regular-table',
    line14Oval: null, line17Oval: null, line17Percent: null, truncatedLines: [], filingReady: false,
  };
  const reasons = new Map<PendingLine, PendingReason>();
  const pend = (line: PendingLine, reason: PendingReason) => { if (!reasons.has(line)) reasons.set(line, reason); };
  const finish = () => {
    result.pending = Array.from(reasons, ([line, reason]) => ({ line, reason }));
    return result;
  };
  if (input.taxYear !== 2025) { pend('scope','unsupported-year'); return finish(); }
  if (input.fullYearResident !== true || input.filingStatus !== 'individual' || input.casesReviewed !== true) {
    pend('scope','unconfirmed-scope'); return finish();
  }
  if (input.method !== 'regular-table') { pend('scope','unsupported-method'); return finish(); }
  const confirmed = input.confirmedDollars ?? {};
  if (typeof confirmed !== 'object' || Array.isArray(confirmed) || Object.keys(confirmed).some(k => !fields.has(k))) {
    pend('scope','unsupported-input'); return finish();
  }

  const amounts: Partial<Record<PendingLine, bigint>> = {};
  function put(line: Form482Line2025, value: bigint) {
    if (value < 0n || value > MAX) { pend(line,'outside-safe-range'); return; }
    amounts[line] = value;
    result.lines[line] = Number(value);
  }
  function calculate(line: Form482Line2025, dependencies: readonly PendingLine[], formula: (nums: bigint[]) => bigint) {
    if (reasons.has(line)) return;
    const nums = dependencies.map(key => amounts[key]);
    if (nums.some(n => n === undefined)) { pend(line,'missing-dependency'); return; }
    put(line, formula(nums as bigint[]));
  }
  function reject(line: Form482ConfirmedField2025, reason: PendingReason) {
    delete amounts[line];
    if (line !== 'grossFor17') delete result.lines[line];
    pend(line,reason);
  }
  const percentLine = (line: '14' | '17', numerator: bigint) => {
    if (numerator % 100n !== 0n) result.truncatedLines.push(line);
    return numerator / 100n;
  };

  for (const key of FORM482_CONFIRMED_DOLLAR_FIELDS_2025) {
    const n = Object.hasOwn(confirmed,key) ? confirmed[key] : null;
    if (n == null) { pend(key,'unconfirmed-input'); continue; }
    if (!Number.isSafeInteger(n) || n < 0) { pend(key,'invalid-whole-dollar-input'); continue; }
    const value = BigInt(n);
    if ((key === '8A' && value % 2_500n !== 0n) || (key === '8B' && value % 1_250n !== 0n)
      || (key === '9' && value !== 0n && value !== 1_500n)) {
      pend(key,'invalid-confirmed-exemption'); continue;
    }
    if (key === 'grossFor17') amounts[key] = value;
    else put(key,value);
  }

  put('7',3_500n);
  calculate('8C',['8A','8B'],([a,b]) => a+b);
  calculate('10',['6','7','8C','9'],([a,b,c,d]) => a+b+c+d);
  calculate('11',['5','10'],([a,b]) => nonnegative(a-b));
  // The stricter 15% limit depends on fund classification; no classification
  // or eligibility is inferred. Even the maximum FCP-PR cap is 30% of line 11.
  if (amounts['11'] !== undefined && amounts['12'] !== undefined && amounts['12'] * 100n > amounts['11'] * 30n)
    reject('12','private-capital-exceeds-maximum');
  calculate('13',['11','12'],([a,b]) => nonnegative(a-b));
  calculate('14',['13'],([base]) => percentLine('14',tableHundredths(base)));
  if (amounts['14'] !== undefined) result.line14Oval = 1;
  if (amounts['13'] !== undefined && amounts['13'] > 500_000n) pend('15','gradual-adjustment-required');
  else calculate('15',['13'],() => 0n);
  calculate('16',['14','15'],([a,b]) => a+b);
  calculate('17',['16','grossFor17'],([tax,gross]) => {
    result.line17Percent = gross > 100_000n ? 95 : 92;
    // Official form uses 1 = 95%, 2 = 92%; line 14 oval 1 is a different box.
    result.line17Oval = result.line17Percent === 95 ? 1 : 2;
    return percentLine('17',tax*BigInt(result.line17Percent));
  });
  if (amounts['18'] !== undefined && amounts['17'] !== undefined && amounts['18'] > amounts['17'])
    reject('18','credit-exceeds-regular-tax');
  calculate('19',['17','18'],([a,b]) => a-b);
  if ((amounts['20'] ?? 0n) > 0n && (amounts['21'] ?? 0n) > 0n) {
    reject('20','incompatible-alternative-tax-lines');
    reject('21','incompatible-alternative-tax-lines');
  }
  // A positive carry-forward credit cannot exceed a quarter of the excess
  // of line 19 over alternative tax. Without the underlying alternate tax
  // calculation, this is only a necessary upper limit, not verification.
  if (amounts['19'] !== undefined && amounts['21'] !== undefined && amounts['21'] > amounts['19'] / 4n)
    reject('21','credit-exceeds-alternative-maximum');
  calculate('22',['19','20','21'],([a,b,c]) => a+b-c);
  put('23',0n); // Oval 1 attestation excludes Anejo X.
  calculate('26',['22','23','24','25'],([a,b,c,d]) => nonnegative(a+b+c-d));
  calculate('27F',['27A','27B','27C','27D','27E'],([a,b,c,d,e]) => a+b+c+d+e);
  calculate('28',['26','27F'],([a,b]) => nonnegative(a-b));
  calculate('29',['26','27F'],([a,b]) => nonnegative(b-a));
  calculate('31',['28','29','30'],([due,credit,addition]) => {
    const net = due+addition-credit;
    const absolute = net < 0n ? -net : net;
    if (absolute <= MAX) result.balance = {
      type: net > 0n ? 'payment' : net < 0n ? 'overpayment' : 'zero',
      dollars: Number(absolute),
    };
    return absolute;
  });
  return finish();
}
