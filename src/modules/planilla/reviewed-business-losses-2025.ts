/** Hacienda 2025 instructions, pp. 87–88 (current) and pp. 87, 91 (carryforwards).
 * https://hacienda.pr.gov/sites/default/files/inst_individuos_2025_1_abr_26.pdf
 * Only regular tax, ordinary Form 482, no alternate/CO, special rate, decree, disputed
 * classification, spouse's additional activity or disregarded entity. Scope flags
 * must come from affirmative reviews; no inference from ledger labels.
 */
type Schedule = 'K' | 'M';
type ReviewedCurrentBusiness = {
  schedule: Schedule;
  businessId: string;
  verified: boolean;
  regularPartIVLine9Cents: number;
};
type CurrentInput = {
  year: number;
  ordinaryScopeVerified: boolean;
  completeBusinessesVerified: boolean;
  principal: Schedule | null;
  businesses: readonly ReviewedCurrentBusiness[];
};
type CurrentResult =
  | { status: 'pending'; reason: string }
  | { status: 'reviewed'; annex: Record<Schedule, number>; transfers: Record<'2Q' | '2S', number> };

const idValid = (id: unknown): id is string =>
  typeof id === 'string' && id.length > 0 && id.length <= 128 && id.trim() === id;

/** Full signed loss stays in the annex; the permitted page-2 transfer is separate. */
export function reviewCurrentBusinessLoss2025(input: CurrentInput): CurrentResult {
  if (input.year !== 2025 || input.ordinaryScopeVerified !== true || input.completeBusinessesVerified !== true)
    return { status: 'pending', reason: 'Revise que sea 2025, contribución regular y que estén todas las actividades.' };
  if (input.principal !== 'K' && input.principal !== 'M')
    return { status: 'pending', reason: 'Confirme cuál de estas actividades es su negocio principal.' };
  if (input.businesses.length !== 2)
    return { status: 'pending', reason: 'Esta revisión requiere exactamente un negocio K y un negocio M.' };
  const k = input.businesses.find(b => b.schedule === 'K');
  const m = input.businesses.find(b => b.schedule === 'M');
  if (!k || !m || !idValid(k.businessId) || !idValid(m.businessId) || k.businessId === m.businessId ||
      k.verified !== true || m.verified !== true ||
      !Number.isSafeInteger(k.regularPartIVLine9Cents) || !Number.isSafeInteger(m.regularPartIVLine9Cents))
    return { status: 'pending', reason: 'Revise identidad, actividad y Parte IV línea 9 regular de cada anejo.' };
  const K = k.regularPartIVLine9Cents || 0;
  const M = m.regularPartIVLine9Cents || 0;
  if (!((K < 0 && M > 0) || (M < 0 && K > 0)))
    return { status: 'pending', reason: 'Este cálculo solo aplica con una pérdida y una ganancia de negocios distintas.' };
  return {
    status: 'reviewed',
    annex: { K, M },
    transfers: {
      '2Q': K >= 0 ? K : input.principal === 'K' ? -Math.min(-K, M) : 0,
      '2S': M >= 0 ? M : input.principal === 'M' ? -Math.min(-M, K) : 0,
    },
  };
}

type PriorInput = {
  year: number;
  ordinaryScopeVerified: boolean;
  /** One active business only; input false if there is another loss year/category. */
  singleBusinessAndLossYearVerified: boolean;
  activeBusiness: { businessId: string; schedule: Schedule; regularPartIVLine3Cents: number; verified: boolean };
  origin: {
    businessId: string;
    taxYear: number;
    originalCents: number;
    previouslyAppliedCents: number;
    /** Explicit reviewed zero required for this isolated post-2020 route. */
    adjustmentReductionCents: number;
    availableCents: number;
    /** Explicit null means a reviewed no-expiration case, never a missing date. */
    expiresOn: string | null;
    verified: boolean;
  };
};
type PriorResult =
  | { status: 'pending'; reason: string; deductionCents: null }
  | { status: 'reviewed'; availableCents: number; capCents: number; deductionCents: number; checklist: readonly string[] };

const nonnegative = (n: number) => Number.isSafeInteger(n) && n >= 0;
function validDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(value + 'T00:00:00Z');
  return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

/** Same-source post-2020 only. Returns a reviewed amount for Part IV line 8,
 * not a legal eligibility determination or a calculation of Part IV line 9. */
export function reviewPriorBusinessLoss2025(input: PriorInput): PriorResult {
  const pending = (reason: string): PriorResult => ({ status: 'pending', reason, deductionCents: null });
  if (input.year !== 2025 || input.ordinaryScopeVerified !== true || input.singleBusinessAndLossYearVerified !== true)
    return pending('Confirme el caso ordinario de 2025 con una sola actividad y un solo año de pérdida.');
  const { activeBusiness: business, origin } = input;
  if (business.verified !== true || origin.verified !== true || !idValid(business.businessId) ||
      business.businessId !== origin.businessId || !['K', 'M'].includes(business.schedule) ||
      !nonnegative(business.regularPartIVLine3Cents) || business.regularPartIVLine3Cents === 0)
    return pending('La pérdida debe corresponder a la misma actividad activa, con ganancia regular revisada en Parte IV, línea 3.');
  if (!Number.isInteger(origin.taxYear) || origin.taxYear < 2021 || origin.taxYear > 2024)
    return pending('Las pérdidas de 2020, anteriores o de otros períodos requieren revisión separada.');
  if (origin.expiresOn !== null && (!validDate(origin.expiresOn) || origin.expiresOn < '2025-12-31'))
    return pending('Confirme la vigencia de la pérdida hasta el cierre del año contributivo.');
  const { originalCents, previouslyAppliedCents, adjustmentReductionCents, availableCents } = origin;
  if (![originalCents, previouslyAppliedCents, adjustmentReductionCents, availableCents].every(nonnegative) ||
      originalCents === 0 || originalCents - previouslyAppliedCents < adjustmentReductionCents ||
      originalCents - previouslyAppliedCents - adjustmentReductionCents !== availableCents)
    return pending('El saldo disponible no concuerda con la pérdida original, lo utilizado y el ajuste revisado.');
  if (adjustmentReductionCents !== 0)
    return pending('Esta ruta exige confirmar un ajuste de cero. Revise todo ajuste por separado.');
  // Exact floor in integer cents without multiplying a safe integer beyond its range.
  // IV.8 = min(history line 14, 90% of IV.3) in this narrowly verified scenario.
  const gain = business.regularPartIVLine3Cents;
  const capCents = Math.floor(gain / 10) * 9 + Math.floor((gain % 10) * 9 / 10);
  return { status: 'reviewed', availableCents, capCents, deductionCents: Math.min(availableCents, capCents), checklist: [
    'Conserve evidencia del año, origen, saldo utilizado, ajuste y vencimiento, si aplica.',
    'Importe para Parte IV, línea 8. Revise las demás líneas antes de calcular la línea 9.',
  ] };
}
