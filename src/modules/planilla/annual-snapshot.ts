import type { TaxSnapshot } from '../tax/types';
import { pendingItems } from '../tax/domain';
import { prepararAnio, type PerfilContributivo, type RegistroAnual, type RespuestaContributiva } from './annual-guided';

export const deductionApprovalStamp = (movementVersion: number, reviewId: string, reviewVersion: number) =>
  JSON.stringify([movementVersion, reviewId, reviewVersion]);
const validMoney = (n: number | null): n is number => n !== null && Number.isSafeInteger(n) && n >= 0;
const validDate = (date: string, year: number) => {
  if (!date.startsWith(`${year}-`) || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const parsed = new Date(date + 'T00:00:00Z');
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date;
};

export function prepararExpedienteGuiado(
  anio: number, perfiles: PerfilContributivo[], source: TaxSnapshot, respuestas: RespuestaContributiva[] = [],
) {
  if (source.year !== anio) throw new Error('El expediente no corresponde al año seleccionado.');
  const answers = new Map(respuestas.map(r => [r.clave, r.valor]));
  const knownProfiles = new Set(perfiles);
  const hasBusiness = perfiles.some(p => p !== 'asalariado');
  const records: RegistroAnual[] = [];
  const unique = new Set<string>();
  const issues: string[] = [];
  let deduciblesConfirmadosCentavos = 0, ingresosSinBruto = 0, retencionesSinConfirmar = 0,
    gastosSinRevisar = 0, ingresosSinClasificar = 0, movimientosConsiderados = 0;
  const add = (m: { id: string; date: string }, tipo: RegistroAnual['tipo'], centavos: number) =>
    records.push({ id: `${m.id}:${tipo}`, fecha: m.date, tipo, centavos });
  for (const m of source.movements) {
    if (m.deletedAt || !['income', 'expense'].includes(m.kind)) continue;
    if (!validDate(m.date, anio)) {
      if (m.date.startsWith(`${anio}-`)) issues.push(`Fecha inválida: ${m.id}.`);
      continue;
    }
    if (unique.has(m.id)) { issues.push(`Movimiento duplicado omitido: ${m.id}.`); continue; }
    unique.add(m.id);
    movimientosConsiderados++;
    const reviewed = source.entries.find(e => e.year === anio && e.movementId === m.id &&
      e.sourceVersion === m.version && ['received', 'corrected'].includes(e.status));
    if (m.kind === 'income') {
      if (validMoney(m.grossCents)) add(m, 'ingreso', m.grossCents);
      else ingresosSinBruto++;
      if (validMoney(m.withholdingCents) && (!validMoney(m.grossCents) || m.withholdingCents <= m.grossCents)) {
        add(m, 'retencion', m.withholdingCents);
      } else retencionesSinConfirmar++;
      if (reviewed?.classification !== 'salary' && reviewed?.classification !== 'other_income') ingresosSinClasificar++;
      continue;
    }
    if (!validMoney(m.amountCents)) { gastosSinRevisar++; continue; }
    add(m, 'gasto', m.amountCents);
    const claimed = reviewed && answers.get(`deducible-version:${m.id}`) === deductionApprovalStamp(m.version, reviewed.id, reviewed.version) ? answers.get(`deducible:${m.id}`) : null;
    const use = reviewed?.useKind ?? m.useKind;
    if (!hasBusiness || use === 'personal' || (reviewed && claimed === false)) continue;
    const bps = reviewed?.businessBps;
    const businessBps = reviewed?.classification === 'expense_review' ? (
      use === 'business' ? 10_000 :
      use === 'mixed' && typeof bps === 'number' && Number.isInteger(bps) && bps > 0 && bps < 10_000 && reviewed.notes.trim() ? bps : null
    ) : null;
    if (claimed !== true || businessBps === null) { gastosSinRevisar++; continue; }
    const share = Number((BigInt(m.amountCents) * BigInt(businessBps) + 5_000n) / 10_000n);
    deduciblesConfirmadosCentavos += share;
  }
  const prepared = prepararAnio(anio, perfiles, records, respuestas);
  if (![deduciblesConfirmadosCentavos, ...Object.values(prepared.totales)].every(Number.isSafeInteger)) {
    throw new Error('Las cantidades del año exceden el rango seguro; revisa los registros.');
  }
  const anejos: {id: string; estado: 'considerar'|'pendiente'; motivo: string}[] = [];
  const schedules = [
    ['J', 'actividadManufactura', 'manufactura'],
    ['K', 'actividadVentas', 'venta de mercancía'],
    ['L', 'actividadAgricultura', 'agricultura'],
    ['M', 'actividadServicios', 'servicios'],
    ['N', 'actividadAlquiler', 'alquiler'],
  ] as const;
  if (hasBusiness || answers.get('otrosIngresos') === true) for (const [id, key, label] of schedules) {
    if (answers.get(key) === true || (id === 'M' && knownProfiles.has('contratista') && answers.get(key) !== false)) {
      anejos.push({ id, estado: 'considerar', motivo: `Actividad identificada: ${label}. Confirma la aplicación para el año.` });
    }
  }
  if (hasBusiness && !anejos.length) anejos.push({ id:'J–N', estado:'pendiente', motivo:'Identifica las actividades para seleccionar anejos.' });
  const dependents = answers.get('dependientes');
  if (typeof dependents === 'number' && dependents > 0) anejos.push({ id:'A1', estado:'considerar', motivo:'Dependientes declarados; verifica que cualifiquen.' });
  if (answers.get('creditos') === true) anejos.push({ id:'CT', estado:'pendiente', motivo:'Evalúa el Crédito por Trabajo con los requisitos oficiales del año.' });
  if (answers.get('deducciones') === true) anejos.push({ id:'A', estado:'considerar', motivo:'Deducciones personales declaradas por revisar.' });
  const countIssues = [
    [ingresosSinBruto, 'ingreso(s) sin bruto confirmado'],
    [ingresosSinClasificar, 'ingreso(s) sin clasificación revisada'],
    [retencionesSinConfirmar, 'ingreso(s) con retención desconocida o incongruente'],
    [gastosSinRevisar, 'gasto(s) sin deducibilidad confirmada'],
  ] as const;
  return { ...prepared, deduciblesConfirmadosCentavos, ingresosSinBruto, retencionesSinConfirmar, gastosSinRevisar,
    movimientosConsiderados, ingresosSinClasificar, anejos,
    netoPreliminarCentavos: movimientosConsiderados && !ingresosSinBruto && !ingresosSinClasificar && !gastosSinRevisar && !issues.length
      ? prepared.totales.ingresosCentavos - deduciblesConfirmadosCentavos : null,
    advertencias: [...new Set([...prepared.advertencias, ...issues, ...countIssues.filter(([n]) => n).map(([n, label]) => `${n} ${label}.`),
      'Las informativas se concilian contra el libro; nunca se suman como ingresos nuevos.', ...pendingItems(source)])],
  };
}
