import { readFileSync, writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { emptyClosure, evaluateClosure } from '../src/modules/planilla/engine';
import { buildClosurePDF } from '../src/modules/planilla/pdf';
import { emptyForm482Intake, validateForm482Intake2025 } from '../src/modules/planilla/form482-intake-2025';
import { resolveForm4822025 } from '../src/modules/planilla/form482-resolve-2025';
import { WORK_CREDIT_ELIGIBILITY_KEYS, type WorkCreditInput } from '../src/modules/planilla/year-rules';

function withLoss() {
  const c = emptyClosure(2025);
  c.draft482 = {
    ...emptyForm482Intake(), individualResident:true, incomeCoverage:'salary-services',
    standardMethodConfirmed:true, singleActivityLossConfirmed:true,
    values:{ serviceReceipts:960000, serviceGain:-240000, grossFor17:3600000 },
  };
  c.answers.boxesVerified = c.answers.allDocuments = 'yes';
  c.salaryCents = 2640000;
  c.withheldCents = 120000;
  return c;
}

describe('Borrador 482: pérdida ordinaria verificada del año', () => {
  it('conserva la pérdida del servicio en M y no la resta de sueldos', () => {
    const c = withLoss();
    validateForm482Intake2025(c.draft482!, c.year);
    const r = resolveForm4822025(c)!;
    expect(r.anejos.M?.netGainCents).toBe(-240000);
    expect(r.mTransfer).toBe(0);
    expect(r.salary).toBe(26400);
    expect(r.lines['5']).toBe(26400);
    expect(r.balance).toBeNull();
  });
  it('no presume cero cuando el alcance de una pérdida no está confirmado', () => {
    const c = withLoss();
    c.draft482!.singleActivityLossConfirmed = false;
    const r = resolveForm4822025(c)!;
    expect(r.mTransfer).toBeUndefined();
    expect(r.anejos.M?.netGainCents).toBeUndefined();
    expect(r.incomeTotal).toBeUndefined();
  });
  it('no aplica el camino estrecho a pérdidas con venta y servicios', () => {
    const c = withLoss();
    c.draft482!.incomeCoverage = 'mixed';
    Object.assign(c.draft482!.values, {goodsReceipts:200000,goodsGain:50000});
    const r = resolveForm4822025(c)!;
    expect(r.kTransfer).toBeUndefined();
    expect(r.mTransfer).toBeUndefined();
    expect(r.lines['5']).toBeUndefined();
  });
  it('permite pérdidas enteras en los renglones revisados, no en deducciones o retenciones', () => {
    const c = withLoss();
    c.draft482!.values['professionalWithheld'] = -10_000;
    expect(() => validateForm482Intake2025(c.draft482!,c.year)).toThrow();
    delete c.draft482!.values['professionalWithheld'];
    c.draft482!.values.serviceGain = -1234;
    expect(() => validateForm482Intake2025(c.draft482!,c.year)).toThrow();
  });
  it('integra M y un CT revisado en el mismo PDF informativo, sin cambiar 27C', async () => {
    const c = withLoss();
    c.salaryCents=1_000_000;
    c.draft482!.values.grossFor17=1_960_000;
    c.components={'27C':150000};
    const credit:WorkCreditInput = {
      taxYear:2025,filingStatus:'individual',
      eligibility:Object.fromEntries(WORK_CREDIT_ELIGIBILITY_KEYS.map(key=>[key,true])),
      earnedIncome:{cents:1000000,verified:true},otherIncome:{cents:0,verified:true},qualifiedDependents:{count:0,verified:true},
    };
    const asset=(file:string)=>readFileSync('assets/tax/2025/'+file);
    const output=await buildClosurePDF(c,evaluateClosure(c,'laboratory'),
      asset('form-482-informativo.pdf'),asset('schedule-ct-informativo.pdf'),asset('schedules-informativo.pdf'),credit);
    const pdf=await PDFDocument.load(output);
    expect(pdf.getTitle()).toMatch(/no radicado/i);
    expect(pdf.getPageCount()).toBe(11);
    expect(c.components['27C']).toBe(150000);
    if(process.env.EDUMONEY_CT_LOSS_PDF)writeFileSync(process.env.EDUMONEY_CT_LOSS_PDF,output);
  });
});
