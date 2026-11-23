import { cents } from '../../src/core/money';
import type { LedgerMovement } from '../../src/modules/money/types';
import type { PerfilContributivo, RespuestaContributiva } from '../../src/modules/planilla/annual-guided';
import type { Statement, TaxEntry, TaxSnapshot } from '../../src/modules/tax/types';
import type { StoredDocument } from '../../src/modules/documents/types';

/** Named and deliberately fictitious annual fixtures. All expected amounts below are independently written integer cents, not estimated tax. */
export const ANNUAL_FIXTURE_MONTHS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
type Fixture = {
  id: string;
  perfiles: PerfilContributivo[];
  respuestas: RespuestaContributiva[];
  source: TaxSnapshot;
  expected: {
    ingresosCentavos: number;
    gastosCentavos: number;
    retencionesCentavos: number;
    deduciblesConfirmadosCentavos: number;
    netoPreliminarCentavos: number | null;
    ingresosSinBruto: number;
  };
};

function movement(id: string, month: string, kind: LedgerMovement['kind'], amount: number, options: Partial<LedgerMovement> = {}): LedgerMovement {
  const date = '2025-' + month + '-14';
  return {
    id, idempotencyKey: 'synthetic-' + id, kind, amountCents: cents(amount), currency: 'USD', date,
    description: 'FICTICIO · ' + id, categoryId: null, paymentMethod: null, taxReview: true, useKind: 'unknown',
    grossCents: null, withholdingCents: null, createdAt: date + 'T17:00:00Z', updatedAt: date + 'T17:00:00Z',
    deletedAt: null, incomeType: 'manual', scheduleId: null, occurrenceDate: null, version: 1, ...options,
  };
}
function income(id: string, month: string, gross: number, retained: number): LedgerMovement {
  return movement(id, month, 'income', gross - retained, { grossCents: cents(gross), withholdingCents: cents(retained) });
}
function review(m: LedgerMovement, useKind: TaxEntry['useKind'], options: Partial<TaxEntry> = {}): TaxEntry {
  return {
    id: 'review-' + m.id, year: 2025, movementId: m.id, documentId: null,
    classification: m.kind === 'expense' ? 'expense_review' : 'other_income',
    useKind, businessBps: null, status: 'received', notes: 'FICTICIO: revisión documental de uso',
    sourceVersion: m.version, version: 1, ...options,
  };
}
function answer(clave: string, valor: RespuestaContributiva['valor']): RespuestaContributiva {
  return { clave, valor };
}
function confirmation(m: LedgerMovement): RespuestaContributiva[] {
  const reviewEntry = review(m, 'business');
  return [answer('deducible:' + m.id, true), answer('deducible-version:' + m.id, JSON.stringify([m.version, reviewEntry.id, reviewEntry.version]))];
}
function empty(year = 2025): TaxSnapshot {
  return {
    year, profile: { year, residence: 'full_year_pr', filingStatus: 'single', incomeSources: 'FICTICIO', notes: '', version: 1 },
    entries: [], statements: [], links: [], movements: [], documents: [],
  };
}
function evidence(source: TaxSnapshot, id: string, formType: string, grossCents: number, withheldCents: number, moves: LedgerMovement[], options: Partial<Statement> = {}) {
  const document: StoredDocument = {
    id: 'ficticio-doc-' + id, movementId: null, billId: null, sha256: '0'.repeat(64), encryptedPath: null, supersedesId: null,
    status: 'received', source: 'manual', kind: 'note', description: 'Comprobante FICTICIO', date: '2025-12-31',
    amountCents: null, notes: '', mime: null, createdAt: '2025-12-31T17:00:00Z', deletedAt: null, copyDeletedAt: null, version: 1,
  };
  source.documents.push(document);
  source.statements.push({
    id, year: 2025, formType, payer: 'Pagador FICTICIO', reference: 'ficticio-' + id, grossCents, withheldCents,
    netCents: grossCents - withheldCents, status: 'received', documentId: document.id, documentVersion: document.version,
    supersedesId: null, notes: '', version: 1, ...options,
  });
  source.links.push(...moves.map(m => ({ statementId: id, movementId: m.id, movementVersion: m.version })));
}

function asalariado(): Fixture {
  const source = empty();
  const payroll = ANNUAL_FIXTURE_MONTHS.map(m => income('salario-' + m, m, 300000, 10000));
  source.movements = [...payroll, ...ANNUAL_FIXTURE_MONTHS.map(m => movement('hogar-' + m, m, 'expense', 12500))];
  source.entries = payroll.map(m => review(m, 'personal', { classification: 'salary' }));
  source.movements.push(
    movement('mov-propio', '03', 'transfer', 54321),
    movement('prestamo', '05', 'loan', 52345),
    movement('pago-tarjeta', '08', 'debt_payment', 10999),
    movement('aportacion-meta', '09', 'goal_contribution', 9900),
    { ...income('sueldo-borrado', '04', 88888, 100), deletedAt: '2025-04-16T00:00:00Z' },
    { ...income('arrastre-2024', '12', 90999, 100), date: '2024-12-31' },
  );
  evidence(source, 'w2-anual', '499R-2/W-2PR', 3600000, 120000, payroll);
  return { id: 'asalariado', perfiles: ['asalariado'], source, respuestas: [answer('dependientes', 0), answer('comprobante499R2', true)],
    expected: { ingresosCentavos: 3600000, gastosCentavos: 150000, retencionesCentavos: 120000,
      deduciblesConfirmadosCentavos: 0, netoPreliminarCentavos: 3600000, ingresosSinBruto: 0 } };
}

function contratista(): Fixture {
  const source = empty(), respuestas = [answer('actividadServicios', true), answer('gastosDeducibles', true)];
  const fees = ANNUAL_FIXTURE_MONTHS.map(m => income('servicios-' + m, m, 230000, 15000));
  source.movements.push(...fees);
  source.entries.push(...fees.map(m => review(m, 'business')));
  for (const m of ANNUAL_FIXTURE_MONTHS) {
    const materials = movement('materiales-' + m, m, 'expense', 30000);
    const internet = movement('internet-' + m, m, 'expense', 10000);
    const meal = movement('comida-personal-' + m, m, 'expense', 14000);
    const stale = movement('revision-vieja-' + m, m, 'expense', 4000, { version: 2 });
    source.movements.push(materials, internet, meal, stale);
    source.entries.push(review(materials, 'business'), review(internet, 'mixed', { businessBps: 2500 }),
      review(meal, 'personal'), review(stale, 'business', { sourceVersion: 1 }));
    respuestas.push(...[materials, internet, meal, stale].flatMap(confirmation));
  }
  evidence(source, '480sp', '480.6SP', 2760000, 180000, fees);
  evidence(source, '480g-mismos-servicios', '480.6G', 2760000, 180000, fees);
  // Repeated imported row; it does not count a second time even though the records are equal.
  source.movements.push({ ...fees[0] });
  return { id: 'contratista', perfiles: ['contratista'], source, respuestas,
    expected: { ingresosCentavos: 2760000, gastosCentavos: 696000, retencionesCentavos: 180000,
      deduciblesConfirmadosCentavos: 390000, netoPreliminarCentavos: null, ingresosSinBruto: 0 } };
}

function cuentapropista(): Fixture {
  const source = empty(), respuestas: RespuestaContributiva[] = [answer('actividadServicios', null)];
  for (const m of ANNUAL_FIXTURE_MONTHS) {
    const fee = income('por-cuenta-propia-' + m, m, 80000, 0);
    const rent = movement('alquiler-negocio-' + m, m, 'expense', 100000);
    const personal = movement('personal-' + m, m, 'expense', 4000);
    source.movements.push(fee, rent, personal);
    source.entries.push(review(fee, 'business'), review(rent, 'business'), review(personal, 'personal'));
    respuestas.push(...confirmation(rent));
  }
  return { id: 'cuentapropista-con-perdida', perfiles: ['cuentapropista'], source, respuestas,
    expected: { ingresosCentavos: 960000, gastosCentavos: 1248000, retencionesCentavos: 0,
      deduciblesConfirmadosCentavos: 1200000, netoPreliminarCentavos: -240000, ingresosSinBruto: 0 } };
}

function comerciante(): Fixture {
  const source = empty(), respuestas: RespuestaContributiva[] = [
    answer('actividadVentas', true), answer('ivuSeparado', true), answer('ventasNetas', 4800000),
    answer('inventario', null), answer('creditos', null), answer('gastosDeducibles', true),
  ];
  for (const m of ANNUAL_FIXTURE_MONTHS) {
    // Synthetic independent monthly sales book: 430,000 sales - 30,000 refunds = 400,000 net sales, excluding 46,000 IVU collected.
    // Only the already reconciled net-of-sale entry is posted as income; this is not automated sales/returns/IVU classification.
    const sales = income('ventas-sin-ivu-netas-de-devoluciones-' + m, m, 400000, 0);
    const cost = movement('compras-para-reventa-sin-inventario-' + m, m, 'expense', 170000);
    const rent = movement('local-' + m, m, 'expense', 50000);
    source.movements.push(sales, cost, rent);
    source.entries.push(review(sales, 'business'), review(cost, 'business', { status: 'pending' }), review(rent, 'business'));
    respuestas.push(...confirmation(rent));
  }
  return { id: 'comerciante', perfiles: ['comerciante'], source, respuestas,
    expected: { ingresosCentavos: 4800000, gastosCentavos: 2640000, retencionesCentavos: 0,
      deduciblesConfirmadosCentavos: 600000, netoPreliminarCentavos: null, ingresosSinBruto: 0 } };
}

function mixto(): Fixture {
  const source = empty(), payroll: LedgerMovement[] = [], service: LedgerMovement[] = [];
  const respuestas: RespuestaContributiva[] = [answer('actividadServicios', true), answer('retencionesServicios', null), answer('creditos', true)];
  for (const m of ANNUAL_FIXTURE_MONTHS) {
    const salary = income('mixto-salario-' + m, m, 220000, 10000);
    const fee = m === '12' ? movement('mixto-deposito-sin-bruto-diciembre', m, 'income', 132000)
      : income('mixto-servicio-' + m, m, 140000, 8000);
    const expense = movement('mixto-gasto-' + m, m, 'expense', 22000);
    payroll.push(salary); service.push(fee);
    source.movements.push(salary, fee, expense);
    source.entries.push(review(salary, 'personal', { classification: 'salary' }), review(fee, 'business'), review(expense, 'business'));
    respuestas.push(...confirmation(expense));
  }
  evidence(source, 'mixto-w2', '499R-2/W-2PR', 2640000, 120000, payroll);
  evidence(source, 'mixto-servicio-sin-conciliar', '480.6SP', 1680000, 96000, service, { status: 'pending', documentVersion: 0 });
  return { id: 'mixto', perfiles: ['mixto', 'asalariado', 'contratista'], source, respuestas,
    expected: { ingresosCentavos: 4180000, gastosCentavos: 264000, retencionesCentavos: 208000,
      deduciblesConfirmadosCentavos: 264000, netoPreliminarCentavos: null, ingresosSinBruto: 1 } };
}

export function fiveAnnualFixtures(): Fixture[] { return [asalariado(), contratista(), cuentapropista(), comerciante(), mixto()]; }
