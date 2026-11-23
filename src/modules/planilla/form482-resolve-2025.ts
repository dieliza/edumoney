import type { Closure } from './engine';
import { form482ActivityFlags } from './form482-intake-2025';
import { calculateForm4822025 } from './form482-calculation-2025';
import type { OfficialBusiness2025Values } from './official-business-2025';

const whole = (value: number | null | undefined, signed = false) =>
  typeof value === 'number' && Number.isSafeInteger(value) && (signed || value >= 0) && value % 100 === 0 ? value / 100 : undefined;

/** Explicit individual scope. No ledger totals, deposits, missing anejos or estimates are substituted. */
export function resolveForm4822025(c: Closure) {
  const draft = c.draft482;
  if (c.year !== 2025 || !draft) return null;
  const { values, incomeCoverage, individualResident, standardMethodConfirmed } = draft;
  const { k, m, wage } = form482ActivityFlags(incomeCoverage);
  const eligibility = individualResident && standardMethodConfirmed && incomeCoverage !== null;
  const payrollVerified = c.answers.boxesVerified === 'yes' && c.answers.allDocuments === 'yes';
  const salary = wage ? (payrollVerified ? whole(c.salaryCents) : undefined) : 0;
  const wageTax = wage ? (payrollVerified ? whole(c.withheldCents) : undefined) : 0;
  const gainK = k ? whole(values.goodsGain, true) : 0;
  const gainM = m ? whole(values.serviceGain, true) : 0;
  const validK = !k || (whole(values.goodsReceipts) !== undefined && gainK !== undefined && gainK <= whole(values.goodsReceipts)!);
  const validM = !m || (whole(values.serviceReceipts) !== undefined && gainM !== undefined && gainM <= whole(values.serviceReceipts)!);
  // 2025 official instructions pp.17–18 and 87–88: an ordinary verified
  // current loss cannot reduce salaries. Here only the single-activity case
  // without another qualifying trade/business, a carryover or CBA is covered.
  const hasLoss = (gainK ?? 0) < 0 || (gainM ?? 0) < 0;
  const lossCanStayInAnnex = hasLoss && (k !== m) && draft.singleActivityLossConfirmed === true;
  const kTransfer = eligibility && validK && k && (!hasLoss || lossCanStayInAnnex) ? Math.max(0, values.goodsGain!) : undefined;
  const mTransfer = eligibility && validM && m && (!hasLoss || lossCanStayInAnnex) ? Math.max(0, values.serviceGain!) : undefined;
  const sum = salary !== undefined && gainK !== undefined && gainM !== undefined && validK && validM && (!hasLoss || lossCanStayInAnnex)
    ? salary + Math.max(0, gainK) + Math.max(0, gainM) : undefined;
  const agi = sum !== undefined && Number.isSafeInteger(sum) ? sum : undefined;
  const gross = incomeCoverage === 'salary' ? salary : whole(values.grossFor17);
  const paidB = whole(c.components?.['27B']);
  const serviceTax = m ? whole(values.professionalWithheld) : undefined;
  const validB = serviceTax === undefined || (paidB !== undefined && paidB >= serviceTax);
  const anejos: OfficialBusiness2025Values = {
    ...(k ? { K: eligibility ? { goodsReceiptsCents: values.goodsReceipts, netGainCents: kTransfer !== undefined ? values.goodsGain : undefined } : {} } : {}),
    ...(m ? { M: eligibility ? { serviceReceiptsCents: values.serviceReceipts, netGainCents: mTransfer !== undefined ? values.serviceGain : undefined } : {} } : {}),
    ...(m || paidB !== undefined ? { B: eligibility ? {
      professionalWithholdingCents: m ? values.professionalWithheld : undefined,
      totalOtherPaymentsCents: validB && paidB !== undefined ? paidB * 100 : undefined,
    } : {} } : {}),
  };
  const amounts = {
    '5': agi,
    '6': whole(values['6']),
    '8A': whole(values['8A']),
    '8B': whole(values['8B']),
    '9': whole(values['9']),
    '12': whole(values['12']),
    grossFor17: gross !== undefined && agi !== undefined && gross >= agi ? gross : undefined,
    '18': whole(c.components?.['18']),
    '20': whole(c.components?.['20']),
    '21': whole(c.components?.['21']),
    '24': whole(c.components?.['24']),
    '25': whole(c.components?.['25']),
    '27A': wageTax,
    '27B': validB ? paidB : undefined,
    '27C': whole(c.components?.['27C']),
    '27D': whole(c.components?.['27D']),
    '27E': whole(c.components?.['27E']),
    '30': whole(c.components?.['30']),
  };
  const result = calculateForm4822025({
    taxYear: 2025, fullYearResident: individualResident, filingStatus: 'individual',
    method: 'regular-table', casesReviewed: eligibility && (c.components?.['23'] == null || c.components['23'] === 0),
    confirmedDollars: Object.fromEntries(Object.entries(amounts).filter(([,value]) => value !== undefined)),
  });
  const issues: string[] = [];
  if (!eligibility) issues.push('Falta confirmar que eres contribuyente individual residente y que aplica el cálculo regular.');
  if (wage && (salary === undefined || wageTax === undefined)) issues.push('Faltan los sueldos o la retención en dólares enteros verificados en todos los comprobantes.');
  if (!validK) issues.push('Anejo K: confirma ventas y la ganancia revisada; la ganancia no puede superar las ventas informadas.');
  if (!validM) issues.push('Anejo M: confirma los ingresos brutos y la ganancia revisada; la ganancia no puede superar los ingresos informados.');
  if (hasLoss) issues.push(lossCanStayInAnnex
    ? 'Pérdida del año: se conserva en el anejo, pero el traslado a la contribución regular es cero. No reduce sueldos ni se determina el arrastre.'
    : 'La pérdida queda pendiente: verifica si fue una sola actividad, si hubo saldo de años anteriores o si corresponde la contribución básica alterna.');
  if (!validB) issues.push('Anejo B: el total de pagos y retenciones debe incluir la retención real de servicios.');
  if (c.components?.['23']) issues.push('Se informó contribución opcional en la línea 23. No se mezcla con el recorrido de cálculo regular.');
  return {
    ...result, anejos, issues, kTransfer, mTransfer, salary: eligibility && wage ? salary : undefined,
    wageTax: eligibility && wage ? wageTax : undefined,
    incomeTotal: eligibility ? agi : undefined,
    confirmedReductionPercent: eligibility && gross !== undefined && agi !== undefined && gross >= agi ? (gross <= 100_000 ? 92 : 95) : undefined,
  };
}
