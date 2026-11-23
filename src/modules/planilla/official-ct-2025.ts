import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex } from '@noble/hashes/utils.js';
import { PDFDocument, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import { UserInputError } from '../../core/errors';
import { HACIENDA_CT_2025_SHA256 } from './official-drafts';
import { estimateWorkCredit, WORK_CREDIT_2025_BANDS, type WorkCreditInput } from './year-rules';

type Status = 'reference' | 'partial' | 'populated';
type Confirmation = 'unavailable' | 'unconfirmed' | 'mismatch' | 'matches';
export type OfficialCT2025Result = {
  status: Status;
  confirmation: Confirmation;
  estimatedCreditCents: number | null;
  omitted: string[];
};

const PART_III_BOXES = [
  [173.76, 150.30, 81.78, 46.80],
  [351.18, 327.43, 259.15, 223.92],
  [516.72, 493.68, 436.20, 401.70],
  [682.56, 659.52, 602.04, 567.54],
] as const;
const ink = rgb(0, 0.14, 0.45);

function drawInteger(page: PDFPage, font: PDFFont, integer: number, left: number, right: number, y: number) {
  if (!Number.isSafeInteger(integer) || integer < 0) return false;
  const text = String(integer);
  const x = right - font.widthOfTextAtSize(text, 8);
  if (x < left) return false;
  page.drawText(text, { x, y, size: 8, font, color: ink });
  return true;
}
const centsValid = (n: unknown): n is number => typeof n === 'number' && Number.isSafeInteger(n) && n >= 0;

/** Copies the verified official Spanish informative pages. The estimator has totals,
 * not line-item detail; II 1A–C and 2A–C stay blank. Never writes to Form 482.
 * Pass only its separately confirmed line 27C, not the estimator output. */
export async function appendOfficialCT2025(
  pdf: PDFDocument, year: number, template: Uint8Array, font: PDFFont,
  input?: WorkCreditInput, confirmed27CCents?: number | null,
): Promise<OfficialCT2025Result> {
  if (year !== 2025 || bytesToHex(sha256(template)) !== HACIENDA_CT_2025_SHA256)
    throw new UserInputError('El Anejo CT no coincide con la edición oficial española revisada de 2025.');
  const source = await PDFDocument.load(template);
  if (source.getPageCount() !== 5 || [0, 1].some(i => {
    const p = source.getPage(i);
    return p.getWidth() !== 612 || p.getHeight() !== 792 || p.getRotation().angle !== 0;
  })) throw new UserInputError('El Anejo CT no tiene la paginación o el formato revisado.');

  const [partII, partIII] = await pdf.copyPages(source, [0, 1]);
  // The overall draft adds one footer per page; the original Hacienda warning
  // remains visible even when the annex is rendered on its own.
  for (const p of [partII, partIII]) pdf.addPage(p);
  const result = input && input.taxYear === year ? estimateWorkCredit(input) : undefined;
  if (!input || result?.status !== 'estimated') {
    return {
      status: 'reference', confirmation: 'unavailable', estimatedCreditCents: null,
      omitted: ['Anejo CT de referencia: sin un cómputo elegible y verificado no se completó el formulario.'],
    };
  }

  const earned = input.earnedIncome.cents!;
  const other = input.otherIncome.cents!;
  const dependents = input.qualifiedDependents.count!;
  const confirmation: Confirmation = !centsValid(confirmed27CCents) ? 'unconfirmed'
    : confirmed27CCents === result.creditCents ? 'matches' : 'mismatch';
  const omitted = ['Partidas detalladas II 1A–1C y 2A–2C: no se infieren a partir de los totales verificados.'];
  const amount = (page: PDFPage, cents: number, left: number, right: number, y: number, line: string) => {
    if (cents % 100 === 0 && drawInteger(page, font, cents / 100, left, right, y)) return true;
    omitted.push(line + ': importe no trasladado; la plantilla no admite este importe exacto.');
    return false;
  };

  amount(partII, earned, 501, 579, 349.20, 'CT II 1D');
  const otherShown = amount(partII, other, 501, 579, 142.20, 'CT II 2D');
  const earnedShown = amount(partII, earned, 501, 579, 107.70, 'CT II 3');
  const dependentsShown = drawInteger(partII, font, dependents, 501, 579, 96.42);
  if (!dependentsShown) omitted.push('CT II 4: cantidad de dependientes fuera del espacio de la casilla.');

  const index = Math.min(dependents, 3);
  const band = WORK_CREDIT_2025_BANDS[index];
  const [startDollars] = band[input.filingStatus === 'joint' ? 'joint' : 'individual'];
  const start = startDollars * 100;
  const introductory = earned <= start;
  const [entryY, cappedY, reductionY, reducedY] = PART_III_BOXES[index];
  const group = 'ABCD'[index];
  const numerator = introductory ? earned * band.entryBps : (earned - start) * band.reductionBps;
  // Refuse sub-cent precision, fractional dollars, and hidden rounding. Without
  // the visible prerequisites the result must stay out of the official cell.
  const intermediateShown = earnedShown && otherShown && dependentsShown && numerator % 10000 === 0
    && amount(partIII, numerator / 10000, 391, 475, introductory ? entryY : reductionY,
      'CT III ' + group + (introductory ? ' 1' : ' 3b'));
  if (!intermediateShown) omitted.push('CT III: el paso intermedio no puede mostrarse exactamente con los importes visibles.');
  if (confirmation === 'mismatch') omitted.push('Anejo CT y Forma 482, línea 27C, no coinciden. Revise ambos; no se sustituye 27C.');
  if (confirmation === 'unconfirmed') omitted.push('Forma 482, línea 27C, aún no se ha confirmado por separado.');
  const finalShown = intermediateShown && confirmation === 'matches'
    && amount(partIII, result.creditCents, 494, 578, introductory ? cappedY : reducedY,
      'CT III ' + group + (introductory ? ' 2' : ' 3c'));
  return { status: finalShown ? 'populated' : 'partial', confirmation, estimatedCreditCents: result.creditCents, omitted };
}
