import { readFileSync, writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { emptyClosure, evaluateClosure } from '../src/modules/planilla/engine';
import { buildClosurePDF } from '../src/modules/planilla/pdf';
import { emptyForm482Intake, validateForm482Intake2025 } from '../src/modules/planilla/form482-intake-2025';
import { resolveForm4822025 } from '../src/modules/planilla/form482-resolve-2025';

function twoBusinesses() {
  const c = emptyClosure(2025);
  c.draft482 = {...emptyForm482Intake(),individualResident:true,incomeCoverage:'mixed',
    standardMethodConfirmed:true,currentLossPrincipal:'M',
    values:{goodsReceipts:2_500_000,goodsGain:500_000,serviceReceipts:1_600_000,serviceGain:-800_000,grossFor17:7_100_000}};
  c.answers.boxesVerified=c.answers.allDocuments='yes';
  c.salaryCents=3_000_000;c.withheldCents=0;
  return c;
}
function priorBusiness() {
  const c=emptyClosure(2025);
  c.draft482={...emptyForm482Intake(),individualResident:true,incomeCoverage:'services',standardMethodConfirmed:true,
    priorLossScope:'confirmed',priorLossPrincipal:true,priorLossExpiry:'2033-12-31',
    values:{serviceReceipts:950_000,serviceGain:50_000,grossFor17:950_000,priorOriginYear:2023,priorOriginal:650_000,
      priorUsed:100_000,priorAvailable:550_000,priorBase:500_000,priorAllowed:450_000}};
  return c;
}

describe('Pérdidas revisadas K/M, Formulario 482 de 2025',()=>{
  it('topa la pérdida principal sin tocar salarios y conserva el importe original en M',()=>{
    const c=twoBusinesses();const r=resolveForm4822025(c)!;
    expect(r.anejos.M?.netGainCents).toBe(-800_000);
    expect(r.kTransfer).toBe(500_000);expect(r.mTransfer).toBe(-500_000);
    expect(r.lines['5']).toBe(30000);
  });
  it('traslada cero por pérdida no principal y no asume la actividad principal',()=>{
    const c=twoBusinesses();c.draft482!.currentLossPrincipal='K';
    expect(resolveForm4822025(c)?.mTransfer).toBe(0);
    delete c.draft482!.currentLossPrincipal;
    expect(resolveForm4822025(c)?.mTransfer).toBeUndefined();
  });
  it('no traslada pérdida si hay cómputo alternativo o desconocimiento de ingresos',()=>{
    const c=twoBusinesses();c.components={'20':10000};
    expect(resolveForm4822025(c)?.incomeTotal).toBeUndefined();
    c.components={};delete c.draft482!.values.goodsGain;
    expect(resolveForm4822025(c)?.kTransfer).toBeUndefined();
  });
  it('verifica el arrastre de la misma actividad con un límite de $4,500 sin reducir el bruto',()=>{
    const c=priorBusiness();validateForm482Intake2025(c.draft482!,c.year);
    const r=resolveForm4822025(c)!;
    expect(r.anejos.M?.prior).toEqual({adjustedGainCents:500000,deductionCents:450000,availableCents:550000});
    expect(r.mTransfer).toBe(50000);expect(r.lines['5']).toBe(500);
    expect(c.draft482!.values.serviceReceipts).toBe(950000);
  });
  it('rechaza saldo incoherente, vencimiento y exceso del tope aunque coincida la línea 9',()=>{
    const c=priorBusiness(),d=c.draft482!;
    d.values.priorAvailable=560000;expect(resolveForm4822025(c)?.mTransfer).toBeUndefined();
    d.values.priorAvailable=550000;d.priorLossExpiry='2024-12-31';
    expect(resolveForm4822025(c)?.mTransfer).toBeUndefined();
    d.priorLossExpiry='2033-12-31';d.values.priorAllowed=450100;d.values.serviceGain=49900;
    expect(resolveForm4822025(c)?.mTransfer).toBeUndefined();
  });
  it('no infiere ni redondea una deducción revisada y bloquea períodos especiales',()=>{
    const c=priorBusiness(),d=c.draft482!;
    delete d.values.priorAllowed;
    expect(resolveForm4822025(c)?.mTransfer).toBeUndefined();
    d.values.priorAllowed=450000;d.values.priorOriginYear=2020;
    expect(resolveForm4822025(c)?.mTransfer).toBeUndefined();
    expect(()=>validateForm482Intake2025(d,c.year)).toThrow();
  });
  it('genera ejemplos con pérdida limitada y arrastre revisado sin enviar datos',async()=>{
    const file=process.env.EDUMONEY_MULTI_LOSS_DIR;
    const read=(name:string)=>readFileSync('assets/tax/2025/'+name);
    for(const [name,c] of [['actual',twoBusinesses()],['arrastre',priorBusiness()]] as const){
      const output=await buildClosurePDF(c,evaluateClosure(c,'laboratory'),
        read('form-482-informativo.pdf'),undefined,read('schedules-informativo.pdf'));
      expect(output.byteLength).toBeGreaterThan(100000);
      if(file)writeFileSync(file+'/'+name+'.pdf',output);
    }
  });
});
