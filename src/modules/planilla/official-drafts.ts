import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex } from '@noble/hashes/utils.js';
import { PDFDocument, degrees, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import type { Closure, PlanField, evaluateClosure } from './engine';
import { FORM_482_2025, type Form482AmountLine, type Form482DemographicField } from './form482-coordinates-2025';
import { resolveForm4822025 } from './form482-resolve-2025';
import { appendOfficialBusiness2025 } from './official-business-2025';
import { UserInputError } from '../../core/errors';

export const OFFICIAL_DRAFT_YEAR = 2025;
export const HACIENDA_FORM_482_2025_SHA256 = FORM_482_2025.sha256;
export const HACIENDA_CT_2025_URL = 'https://hacienda.pr.gov/sites/default/files/anejo_ct_rev._20_jun_25-informativo.pdf';
export const HACIENDA_CT_2025_SHA256 = '97e41a92503860c982ae150b923f7752587872f4a92e9ac72618a8df1e94bb24';
type Result = ReturnType<typeof evaluateClosure>;
type FundPosition = readonly [page: number, left: number, right: number, baseline: number];
const SALARY_CELLS = {
  '1A-i': [1, 404, 478, 697.08], '1B-i': [1, 506, 580, 697.26],
  '1A': [1, 404, 478, 670.98], '1B': [1, 506, 580, 670.98],
  '27A': [2, 425, 488, 546.90],
} as const satisfies Record<string, FundPosition>;
const ink = rgb(0, 0.14, 0.45);
const draftInk = rgb(0.65, 0, 0);

async function addVerifiedPages(to: PDFDocument, bytes: Uint8Array, hash: string, pages: number, indices: number[]) {
  if (bytesToHex(sha256(bytes)) !== hash) throw new UserInputError('La plantilla no coincide con la edición oficial revisada. No se generó el formulario.');
  const source = await PDFDocument.load(bytes);
  if (source.getPageCount() !== pages || indices.some(index => {
    const p = source.getPage(index);
    const size = p.getSize();
    return size.width !== 612 || size.height !== 792 || p.getRotation().angle !== 0;
  })) throw new UserInputError('El tamaño o las páginas de la plantilla oficial no coinciden.');
  return (await to.copyPages(source, indices)).map(page => to.addPage(page));
}

function putAmount(pages: PDFPage[], font: PDFFont, amount: PlanField | undefined, pos: FundPosition) {
  // La edición informativa imprime "00" en la columna de centavos.
  // Nunca inventar, recortar o redondear centavos para llenar esa columna.
  if (!amount || amount.state !== 'confirmed' || amount.valueCents === null ||
      !Number.isSafeInteger(amount.valueCents) || amount.valueCents < 0 || amount.valueCents % 100 !== 0) return false;
  const [page, left, right, y] = pos;
  const text = String(amount.valueCents / 100);
  const x = right - font.widthOfTextAtSize(text, 8);
  if (x < left) return false;
  pages[page].drawText(text, { x, y, size: 8, font, color: ink });
  return true;
}

function putDollars(page: PDFPage, font: PDFFont, dollars: number, left: number, right: number, y: number) {
  const text = String(dollars);
  const x = right - font.widthOfTextAtSize(text, 8);
  if (!Number.isSafeInteger(dollars) || dollars < 0 || x < left) return false;
  page.drawText(text, { x, y, size: 8, font, color: ink });
  return true;
}

function putIdentity(page: PDFPage, font: PDFFont, data: string | undefined, field: Form482DemographicField) {
  if (!data?.trim()) return true;
  const pos = FORM_482_2025.demographics[field];
  const normalized = data.normalize('NFC').trim().replace(/’/g, "'");
  try {
    const size = Math.min(pos.maxSize, (pos.maxX - pos.x) / font.widthOfTextAtSize(normalized, 1));
    if (size < 5.5) return false;
    page.drawText(normalized, { x: pos.x, y: pos.y, size, font, color: ink });
    return true;
  } catch {
    return false;
  }
}

function mark(page: PDFPage, x: number, y: number) {
  page.drawLine({ start: { x: x - 1.4, y: y - 1.4 }, end: { x: x + 1.4, y: y + 1.4 }, color: ink, thickness: 0.7 });
  page.drawLine({ start: { x: x - 1.4, y: y + 1.4 }, end: { x: x + 1.4, y: y - 1.4 }, color: ink, thickness: 0.7 });
}

/** Añade el original informativo de Hacienda, no una reconstrucción ni una planilla radicable. */
export async function appendOfficialForm482Draft(pdf: PDFDocument, c: Closure, result: Result, template: Uint8Array, font: PDFFont, businessTemplate?: Uint8Array) {
  if (c.year !== OFFICIAL_DRAFT_YEAR || result.year !== c.year || !result.catalogVersion) {
    throw new UserInputError('No hay una plantilla oficial revisada para este año. No se reutiliza la de 2025.');
  }
  const pages = await addVerifiedPages(pdf, template, HACIENDA_FORM_482_2025_SHA256, 57, [0, 1, 2]);
  const prepared = resolveForm4822025(c);
  if (prepared && c.draft482) {
    const notes: string[] = [...prepared.issues];
    const tailors = prepared.anejos;
    const business = businessTemplate && Object.keys(tailors).length
      ? await appendOfficialBusiness2025(pdf, c.year, tailors, businessTemplate, font) : undefined;
    if (!business && Object.keys(tailors).length) notes.push('Los anejos de actividad aplicables no se incluyeron en este archivo.');
    if (business) notes.push(...business.omitted);
    const write = (line: Form482AmountLine, value: number | undefined) => {
      if (value === undefined) return;
      const { page, left, right, baseline } = FORM_482_2025.amounts[line];
      if (!putDollars(pages[page], font, value, left, right, baseline)) {
        notes.push(`Línea ${line}: el importe no cabe en el encasillado.`);
      }
    };
    const p0 = pages[0];
    const identity = [
      ['taxpayerFirstName', c.draft482.givenName], ['taxpayerMiddleInitial', c.draft482.middleInitial],
      ['taxpayerPaternalSurname', c.draft482.paternalSurname], ['taxpayerMaternalSurname', c.draft482.maternalSurname],
    ] as const;
    for (const [field, value] of identity) {
      if (!putIdentity(p0, font, value, field)) notes.push('Un campo de nombre no cabe o no puede escribirse en la plantilla; complétalo al revisar.');
    }
    if (c.draft482.individualResident) {
      for (const key of ['fullYearPrYes','filingIndividual'] as const) {
        const { x, y } = FORM_482_2025.marks[key];
        mark(p0, x, y);
      }
    }
    for (const line of ['1A-i','1A'] as const) write(line, prepared.wageTax);
    for (const line of ['1B-i','1B'] as const) write(line, prepared.salary);
    if (prepared.incomeTotal !== undefined) {
      write('3', prepared.incomeTotal);
      write('4', 0); // Alcance explícito: no pensión pagada por divorcio.
    }
    for (const [line, dollars] of Object.entries(prepared.lines)) write(line as Form482AmountLine, dollars);
    for (const line of ['2Q','2S'] as const) {
      const n = line === '2Q' ? prepared.kTransfer : prepared.mTransfer;
      if (n !== undefined) write(line, n / 100);
    }
    // On the regular table row, tick the oval at the left of the printed option number.
    if (prepared.line14Oval) mark(pages[2], 113.5, 754.5);
    if (prepared.line17Oval) mark(pages[2], prepared.line17Oval === 1 ? 286.5 : 336.0, 699.0);
    if (prepared.balance?.type === 'overpayment') putDollars(p0, font, prepared.balance.dollars, 512, 575, 324);
    if (prepared.balance?.type === 'payment') putDollars(p0, font, prepared.balance.dollars, 512, 575, 255.5);
    if (prepared.truncatedLines.length) notes.push(`En las líneas ${prepared.truncatedLines.join(', ')} se omitió la fracción de dólar para este borrador. No se validó el redondeo de SURI.`);
    notes.push('Los anejos adjuntos son parciales: no sustituyen el desglose de gastos, créditos, deducciones, inventario ni la validación de pérdidas.');
    return notes;
  }
  // Solo las respuestas literales del cierre original; soltero no equivale
  // por sí solo a la clasificación oficial, y el nombre del revisor no es el del contribuyente.
  if (c.answers.fullYearPR === 'yes') mark(pages[0], 47.65, 504.90);
  if (c.answers.fullYearPR === 'no') mark(pages[0], 65.30, 504.80);
  if (c.answers.individual === 'yes') mark(pages[0], 344.32, 405.55);
  const salaryCase = result.calculationAvailable && c.answers.boxesVerified === 'yes' && c.answers.allDocuments === 'yes';
  const omitted: string[] = [];
  if (salaryCase) {
    const a = result.fields.find(field => field.id === '1A');
    const b = result.fields.find(field => field.id === '1B');
    if (putAmount(pages, font, a, SALARY_CELLS['1A-i'])) {
      putAmount(pages, font, a, SALARY_CELLS['1A']);
      putAmount(pages, font, a, SALARY_CELLS['27A']);
    } else omitted.push('Retención salarial: no se trasladó al formulario informativo por importe pendiente o con centavos.');
    if (putAmount(pages, font, b, SALARY_CELLS['1B-i'])) putAmount(pages, font, b, SALARY_CELLS['1B']);
    else omitted.push('Salarios: no se trasladaron al formulario informativo por importe pendiente o con centavos.');
  } else omitted.push('La plantilla no incorpora salarios ni retenciones sin confirmar el alcance y todos los comprobantes.');
  return omitted;
}

/** Referencia opcional CT, páginas del formulario original, sin alterar ni simular elegibilidad. */
export async function appendOfficialCTReference(pdf: PDFDocument, year: number, template: Uint8Array, bold: PDFFont) {
  if (year !== OFFICIAL_DRAFT_YEAR) throw new UserInputError('No hay un Anejo CT oficial revisado para este año.');
  const pages = await addVerifiedPages(pdf, template, HACIENDA_CT_2025_SHA256, 5, [0, 1]);
  for (const p of pages) p.drawText('ANEJO CT DE REFERENCIA - SIN COMPLETAR', { x: 375, y: 6, size: 7, font: bold, color: draftInk });
}

/** Cada página debe conservar una advertencia visible, incluso si se imprime por separado. */
export function markDraftPages(pdf: PDFDocument, bold: PDFFont, laboratory: boolean) {
  for (const p of pdf.getPages()) {
    p.drawText('Borrador de EduMoney — no radicado. No utilice para rendir.', { x: 30, y: 6, size: 7, font: bold, color: draftInk });
    if (laboratory) p.drawText('FICTICIO - NO RADICAR', { x: 110, y: 350, size: 27, rotate: degrees(25), font: bold, color: rgb(0.8, 0, 0), opacity: 0.25 });
  }
}
