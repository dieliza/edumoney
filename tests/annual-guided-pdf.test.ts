import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { fiveAnnualFixtures } from './fixtures/annual-guided-synthetic';
import { prepararExpedienteGuiado } from '../src/modules/planilla/annual-snapshot';
import { buildAnnualSummaryPDF } from '../src/modules/planilla/annual-summary-pdf';
import { emptyClosure, evaluateClosure, questions } from '../src/modules/planilla/engine';
import { completionFields } from '../src/modules/planilla/catalog';
import { emptyForm482Intake } from '../src/modules/planilla/form482-intake-2025';
import { resolveForm4822025 } from '../src/modules/planilla/form482-resolve-2025';
import { buildClosurePDF } from '../src/modules/planilla/pdf';

const template = new Uint8Array(readFileSync('assets/tax/2025/form-482-informativo.pdf'));
const ct = new Uint8Array(readFileSync('assets/tax/2025/schedule-ct-informativo.pdf'));
const business = new Uint8Array(readFileSync('assets/tax/2025/schedules-informativo.pdf'));
describe('Documentos descargables con datos ficticios', () => {
  it.each(fiveAnnualFixtures())('genera los documentos locales del caso $id', async fixture => {
    const { id, source, perfiles, respuestas } = fixture;
    const result = prepararExpedienteGuiado(source.year, perfiles, source, respuestas);
    const c = emptyClosure(result.anio);
    c.notes = 'DATOS FICTICIOS - Ejemplo de prueba anual';
    c.guided = {perfiles,respuestas};
    c.draft482 = {
      ...emptyForm482Intake(),
      givenName: 'Nombre Ficticio',
      paternalSurname: 'Muestra',
      individualResident: true,
      incomeCoverage: id === 'asalariado' ? 'salary' : id === 'comerciante' ? 'retail' : id === 'mixto' ? 'mixed' : 'services',
      standardMethodConfirmed: true,
      values: {'6':0, '8A':0, '8B':0, '9':0, '12':0},
    };
    c.components = Object.fromEntries(completionFields.map(f => [f.id, 0]));
    if (id === 'asalariado' || id === 'mixto') {
      const w2 = source.statements.find(s => s.formType === '499R-2/W-2PR')!;
      for (const [q] of questions) c.answers[q] = 'yes';
      c.salaryCents = w2.grossCents;
      c.withheldCents = w2.withheldCents;
    }
    if (id === 'contratista') {
      // Exercise a hypothetically reviewed M and B from independent (fictitious)
      // annexes, not the unverified deducible total in the ledger.
      Object.assign(c.draft482.values, {serviceReceipts:2760000,serviceGain:2370000,
        grossFor17:2760000,professionalWithheld:180000});
      c.components['27B']=180000;
    }
    if (id === 'comerciante') Object.assign(c.draft482.values, {goodsReceipts:4800000});
    if (id === 'cuentapropista-con-perdida') Object.assign(c.draft482.values, {serviceReceipts:960000});
    if (id === 'mixto') {
      // December documentation is still missing; do not reuse net deposits or a pending statement.
      delete c.components['27B']; delete c.components['27C'];
    }
    const official = resolveForm4822025(c)!;
    if (id === 'asalariado') expect(official.balance).toEqual({type:'payment',dollars:796});
    else if (id === 'contratista') expect(official.balance).toEqual({type:'overpayment',dollars:1079});
    else {
      expect(official.balance).toBeNull();
      expect(official.lines['5']).toBeUndefined();
    }
    const outputs = {
      'informe-anual': await buildAnnualSummaryPDF(result, 'annual', true),
      'retenciones-creditos': await buildAnnualSummaryPDF(result, 'withholding', true),
      '482-borrador': await buildClosurePDF(c, evaluateClosure(c, 'laboratory'), template, id === 'mixto' ? ct : undefined, business),
    };
    for (const [kind, data] of Object.entries(outputs)) {
      const file = await PDFDocument.load(data);
      expect(file.getTitle()).toMatch(/no radicado/i);
      const pages = file.getPages();
      expect(pages.length).toBeGreaterThan(kind === '482-borrador' ? (id === 'mixto' ? 5 : 3) : 0);
      expect(pages.every(page => page.getWidth() === 612 && page.getHeight() === 792)).toBe(true);
      if (process.env.EDUMONEY_SYNTHETIC_PDF_DIR) {
        mkdirSync(process.env.EDUMONEY_SYNTHETIC_PDF_DIR, { recursive: true });
        writeFileSync(join(process.env.EDUMONEY_SYNTHETIC_PDF_DIR, `${id}-${kind}.pdf`), data);
      }
    }
  });
  it('rechaza plantilla modificada y no la reutiliza para otro año', async () => {
    const corrupted = new Uint8Array(template); corrupted[10] ^= 1;
    const c = emptyClosure(2025);
    await expect(buildClosurePDF(c, evaluateClosure(c, 'laboratory'), corrupted)).rejects.toThrow(/no coincide/);
    const c26 = emptyClosure(2026);
    await expect(buildClosurePDF(c26, evaluateClosure(c26, 'laboratory'), template)).rejects.toThrow(/para este año/);
  });
});
