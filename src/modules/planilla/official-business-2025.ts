import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex } from '@noble/hashes/utils.js';
import { PDFDocument, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import { UserInputError } from '../../core/errors';

export const HACIENDA_BUSINESS_2025_URL = 'https://hacienda.pr.gov/sites/default/files/480.8_2025_anejos_0.pdf';
export const HACIENDA_BUSINESS_2025_SHA256 = '61cc10f1bddd9312a56411458118eb22357610168ba4354113170064d31639ab';

export type OfficialBusiness2025Values = {
  K?: { goodsReceiptsCents?: number; netGainCents?: number };
  M?: { serviceReceiptsCents?: number; netGainCents?: number };
  B?: { professionalWithholdingCents?: number; totalOtherPaymentsCents?: number };
};
export type OfficialBusiness2025Transfers = Partial<Record<'2Q' | '2S' | '27B', number>>;

type Box = readonly [left: number, right: number, baseline: number];
const ink = rgb(0, 0.14, 0.45);
const whole = (n: unknown): n is number => typeof n === 'number' && Number.isSafeInteger(n) && n >= 0 && n % 100 === 0;
function put(page: PDFPage, font: PDFFont, value: unknown, [left, right, y]: Box, signed = false) {
  if (!whole(value) && !(signed && typeof value === 'number' && whole(Math.abs(value)))) return false;
  if (typeof value !== 'number') return false;
  const text = String(value / 100);
  const x = right - font.widthOfTextAtSize(text, 8);
  if (x < left) return false;
  page.drawText(text, { x, y, size: 8, font, color: ink });
  return true;
}

/** Inputs are explicitly reviewed *official lines* for a single activity and regular tax.
 * Never feed aggregated ledger operating expenses, deposit net or tentative business net.
 * A missing input is blank, not zero. A negative line follows separate loss rules.
 * Include an empty schedule object to append it as a blank reference. */
export async function appendOfficialBusiness2025(
  pdf: PDFDocument, year: number, values: OfficialBusiness2025Values, template: Uint8Array, font: PDFFont,
): Promise<{ omitted: string[]; transfers: OfficialBusiness2025Transfers }> {
  if (year !== 2025 || bytesToHex(sha256(template)) !== HACIENDA_BUSINESS_2025_SHA256)
    throw new UserInputError('La plantilla oficial de los anejos no coincide con el año revisado.');
  const src = await PDFDocument.load(template);
  if (src.getPageCount() !== 35) throw new UserInputError('Los anejos oficiales no tienen la paginación revisada.');
  const omitted: string[] = [];
  const transfers: OfficialBusiness2025Transfers = {};
  async function append(indices: number[]) {
    if (indices.some(i => {
      const p = src.getPage(i);
      return p.getWidth() !== 612 || p.getHeight() !== 792 || p.getRotation().angle !== 0;
    })) throw new UserInputError('Los anejos oficiales no tienen el formato revisado.');
    return (await pdf.copyPages(src, indices)).map(p => pdf.addPage(p));
  }
  const write = (page: PDFPage, value: unknown, box: Box, line: string, signed = false) => {
    if (value === undefined) return false;
    if (put(page, font, value, box, signed)) return true;
    omitted.push(line + ': importe fuera del formato de la casilla, con centavos o sujeto a revisión de pérdidas.');
    return false;
  };
  if (values.B) {
    const [, p] = await append([2, 3, 4]);
    const { professionalWithholdingCents: retained, totalOtherPaymentsCents: total } = values.B;
    write(p, retained, [511, 578, 594.72], 'B III 9');
    if (total !== undefined && (retained !== undefined && (!whole(retained) || total < retained))) {
      omitted.push('B III 22: el total revisado no concuerda con la retención de servicios.');
    } else if (write(p, total, [511, 578, 218.76], 'B III 22')) transfers['27B'] = total;
  }
  if (values.K) {
    const [p1, p2] = await append([22, 23]);
    write(p1, values.K.goodsReceiptsCents, [146, 215, 533.55], 'K II 1a');
    if (write(p2, values.K.netGainCents, [463, 512, 606.48], 'K IV 9', true) && whole(values.K.netGainCents)) transfers['2Q'] = values.K.netGainCents;
  }
  if (values.M) {
    const [p1, p2] = await append([26, 27]);
    write(p1, values.M.serviceReceiptsCents, [466, 515, 526.86], 'M II 1');
    if (write(p2, values.M.netGainCents, [463, 512, 606.18], 'M IV 9', true) && whole(values.M.netGainCents)) transfers['2S'] = values.M.netGainCents;
  }
  return { omitted, transfers };
}

/** Use only with the same, already verified 2025 Form 482 and regular,
 * non-CO path for income lines; caller must not pass unverified transfers. */
export function writeOfficialBusinessTransfers2025(
  form482Pages: readonly PDFPage[], font: PDFFont, transfers: OfficialBusiness2025Transfers,
): string[] {
  if (form482Pages.length !== 3 || form482Pages.some(p => p.getWidth() !== 612 || p.getHeight() !== 792 || p.getRotation().angle !== 0))
    throw new UserInputError('Se requieren las tres páginas de la Forma 482 de 2025 previamente verificadas.');
  const omitted: string[] = [];
  const fields = {
    '2Q': [1, [509, 579, 341.77]],
    '2S': [1, [509, 579, 313.75]],
    '27B': [2, [426, 488, 532.92]],
  } as const;
  for (const id of ['2Q', '2S', '27B'] as const) {
    const value = transfers[id];
    const [page, box] = fields[id];
    if (value !== undefined && !put(form482Pages[page], font, value, box)) omitted.push('Forma 482 ' + id + ': importe no trasladado.');
  }
  return omitted;
}
