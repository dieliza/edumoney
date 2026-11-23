import { UserInputError } from '../../core/errors';

export const form482BusinessFields = [
  ['goodsReceipts','Ventas de mercancía antes del costo de lo vendido (Anejo K, Parte II, 1(a))'],
  ['goodsGain','Ganancia o pérdida que indica tu Anejo K, Parte IV, línea 9'],
  ['serviceReceipts','Ingresos brutos por servicios (Anejo M, Parte II, línea 1)'],
  ['serviceGain','Ganancia o pérdida que indica tu Anejo M, Parte IV, línea 9'],
  ['professionalWithheld','Retención real en informativas 480.6SP (Anejo B, Parte III, línea 9)'],
] as const;

export const form482OtherFields = [
  ['6','Deducciones verificadas (Anejo A)'],
  ['8A','Exención total por dependientes a $2,500'],
  ['8B','Exención parcial por dependientes a $1,250'],
  ['9','Exención adicional de veterano'],
  ['12','Deducción admisible por inversión de capital privado'],
  ['grossFor17','Ingreso bruto verificado según las instrucciones de la línea 17'],
] as const;

export const form482PriorFields = [
  ['priorOriginYear','Año en que surgió la pérdida (2021 a 2024)'],
  ['priorOriginal','Pérdida original en dólares, sin signo menos'],
  ['priorUsed','Cantidad usada antes de 2025, en dólares'],
  ['priorAvailable','Saldo disponible, en dólares (línea 14 del historial)'],
  ['priorBase','Ingreso neto ajustado de 2025 en dólares (Parte IV, línea 3)'],
  ['priorAllowed','Deducción de 2025 verificada en el anejo (Parte IV, línea 8), en dólares'],
] as const;
export type Draft482Field = typeof form482BusinessFields[number][0] | typeof form482OtherFields[number][0] |
  typeof form482PriorFields[number][0];
export interface Form482Intake2025 {
  individualResident: boolean;
  incomeCoverage: 'salary' | 'services' | 'retail' | 'salary-services' | 'salary-retail' | 'retail-services' | 'mixed' | null;
  standardMethodConfirmed: boolean;
  singleActivityLossConfirmed?: boolean;
  currentLossPrincipal?: 'K' | 'M';
  priorLossScope?: 'review' | 'confirmed';
  priorLossPrincipal?: boolean;
  priorLossExpiry?: string;
  givenName: string;
  paternalSurname: string;
  maternalSurname: string;
  middleInitial: string;
  values: Partial<Record<Draft482Field, number>>;
}

const validKeys = new Set<string>([...form482BusinessFields, ...form482OtherFields, ...form482PriorFields].map(([id]) => id));
const personalText = /^[\p{L}\p{M} .’'-]{0,60}$/u;
export function validateForm482Intake2025(data: Form482Intake2025, year: number) {
  const allowed = [null, 'salary', 'services', 'retail', 'salary-services', 'salary-retail', 'retail-services', 'mixed'];
  if (year !== 2025 || !data || typeof data !== 'object' ||
      typeof data.individualResident !== 'boolean' || typeof data.standardMethodConfirmed !== 'boolean' ||
      (data.singleActivityLossConfirmed !== undefined && typeof data.singleActivityLossConfirmed !== 'boolean') ||
      (data.currentLossPrincipal !== undefined && data.currentLossPrincipal !== 'K' && data.currentLossPrincipal !== 'M') ||
      (data.priorLossScope !== undefined && data.priorLossScope !== 'review' && data.priorLossScope !== 'confirmed') ||
      (data.priorLossPrincipal !== undefined && typeof data.priorLossPrincipal !== 'boolean') ||
      (data.priorLossExpiry !== undefined && (typeof data.priorLossExpiry !== 'string' ||
        (data.priorLossExpiry !== '' && !/^\d{4}-\d{2}-\d{2}$/.test(data.priorLossExpiry)))) ||
      !allowed.includes(data.incomeCoverage) || typeof data.givenName !== 'string' || typeof data.paternalSurname !== 'string' ||
      typeof data.middleInitial !== 'string' || !/^[\p{L}]?$/u.test(data.middleInitial) ||
      typeof data.maternalSurname !== 'string' || !personalText.test(data.maternalSurname) || !personalText.test(data.givenName) || !personalText.test(data.paternalSurname) || !data.values ||
      typeof data.values !== 'object' || Array.isArray(data.values)) {
    throw new UserInputError('Revisa los datos del borrador 482 de 2025.');
  }
  for (const [key, value] of Object.entries(data.values)) {
    if (key === 'priorOriginYear') {
      if (!Number.isInteger(value) || value < 2021 || value > 2024)
        throw new UserInputError('Para este recorrido, indica un año de origen entre 2021 y 2024.');
      continue;
    }
    if (!validKeys.has(key) || !Number.isSafeInteger(value) || (value < 0 && !isSignedBusinessResult(key)) || value % 100 !== 0) {
      throw new UserInputError('Para trasladar a la planilla informativa, confirma los dólares enteros del encasillado. Conserva los centavos en tus registros.');
    }
  }
}

export function emptyForm482Intake(): Form482Intake2025 {
  return { individualResident: false, incomeCoverage: null, standardMethodConfirmed: false, givenName: '', paternalSurname: '', maternalSurname: '', middleInitial: '', values: {} };
}

export function isSignedBusinessResult(key: string) {
  return key === 'goodsGain' || key === 'serviceGain';
}

export function form482ActivityFlags(coverage: Form482Intake2025['incomeCoverage']) {
  return {
    k: coverage === 'retail' || coverage === 'salary-retail' || coverage === 'retail-services' || coverage === 'mixed',
    m: coverage === 'services' || coverage === 'salary-services' || coverage === 'retail-services' || coverage === 'mixed',
    wage: coverage === 'salary' || coverage === 'salary-retail' || coverage === 'salary-services' || coverage === 'mixed',
  };
}
