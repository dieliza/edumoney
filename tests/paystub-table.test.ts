import {expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {recognizeIncome} from '../src/modules/income/recognition';
import {reconcilePhotoReadings} from '../src/modules/documents/photoReadings';
import {printedAmounts} from '../src/modules/documents/printedAmounts';
const sample=`PATRONO FICTICIO
Pay Date Start Period End Period
11/12/2026 10/30/2026 11/12/2026
Earnings Taxes & Payroll Deductions
Code Rate Hours Amount Code Amount Year To Date
REGHR $11.50] 48.05) $552.58|FICA
OVRHR
INCP.
VAC $11.00 0.00} $0.00
SICK $11.00 0.00 $0.00 |1.T $55.26] $55.26]
OTHR $11.00 0.00} $0.00
HOLD $11.00 0.00 $0.00 |MED. INS 0
Gross wages/period $552.58) Net wages / period $497.32)
Gross wages YTD $552.58] Net wages YTD $497.32]
Payment
CHECK $497.32`;
it('lee celdas contiguas a bordes sin descartar cifras',()=>{expect(printedAmounts('$552.58|FICA $55.26] 48.05) $0.00}').map(m=>m.amount)).toEqual(['552.58','55.26','48.05','0.00']);expect(printedAmounts('Neto497.32').map(m=>m.amount)).toEqual(['497.32']);});
it('separa bruto y neto en una misma fila y descarta sus acumulados',()=>{const p=recognizeIncome(sample);expect(p.gross).toBe('552.58');expect(p.net).toBe('497.32');expect(p.deductions.find(d=>/1.T/.test(d.label))?.amount).toBe('55.26');expect(p.deductions.find(d=>/1.T/.test(d.label))?.categoryId).toBe('other');});
it('conserva tarifas, horas y filas de ingresos sin tratarlas como deducciones',()=>{const p=recognizeIncome(sample);expect(p.earnings.find(r=>r.code==='REGHR')).toEqual({code:'REGHR',rate:'11.50',hours:'48.05',amount:'552.58'});expect(p.deductions.some(d=>/REGHR|SICK|HOLD/.test(d.label))).toBe(false);expect(p.deductions.find(d=>d.categoryId==='medical')?.amount).toBe('0.00');expect(p.deductions.find(d=>/FICA/.test(d.label))?.amount).toBe('');});
it('reconoce fechas por encabezado y formato deducido de una fecha inequívoca',()=>{const p=recognizeIncome(sample);expect(p.date).toBe('2026-11-12');expect(p.periodStart).toBe('2026-10-30');expect(p.periodEnd).toBe('2026-11-12');expect(recognizeIncome(sample.replace('10/30/2026','10/03/2026')).periodStart).toBe('');});
it('una pasada parcial no contradice las celdas adicionales de otra pasada',()=>{const r=reconcilePhotoReadings([{rows:[{text:'Gross wages/period $552.58]',y:100,height:20}],confidence:99},{rows:[{text:'Gross wages/period $552.58] Net wages / period $497.32]',y:100,height:20}],confidence:85}]);expect(r.needsAmountReview).toBe(false);expect(recognizeIncome(r.text).net).toBe('497.32');});
it('un cambio real de cifra mantiene la revisión pendiente',()=>{const r=reconcilePhotoReadings([{rows:[{text:'I.T 55.26 55.26',y:100,height:20}],confidence:99},{rows:[{text:'I.T 65.26 55.26',y:100,height:20}],confidence:90}]);expect(r.needsAmountReview).toBe(true);});
it('reúne las acciones de la captura en menús por sección, conservando destinos',()=>{const s=readFileSync('src/modules/money/LedgerScreen.tsx','utf8');expect(s).toContain('label="Movimientos y disponible"');expect(s).toContain('label="Ingresos recurrentes"');expect(s).toContain('label="Respaldo y configuración"');expect(s).toContain("setSegment('history')");expect(s).toContain("setForm({kind:'transfer'})");expect(s).toContain("router.push('/backup')");});

it('una ampliación auxiliar equivocada no borra dos lecturas primarias compatibles',()=>{const row=(text:string)=>({text,y:100,height:20,confidence:90});const r=reconcilePhotoReadings([{rows:[row('Gross wages/period 552.58 Net wages/period 497.32')],confidence:90},{rows:[row('Gross wages/period 552.58 Net wages/period 497.32')],confidence:90},{rows:[row('Gross wages/period 552.58 Net wages/period 497.82')],confidence:99,fallback:true}]);expect(r.needsAmountReview).toBe(false);expect(recognizeIncome(r.text).net).toBe('497.32');});
it('separa un dígito de las reglas de la tabla sin inventar un cero en una celda vacía',async()=>{const {clearCellRules}=await import('../src/modules/documents/zeroCells');const w=100,h=30,pixels=new Uint8ClampedArray(w*h*4).fill(255);const black=(x:number,y:number)=>{const at=(y*w+x)*4;pixels[at]=pixels[at+1]=pixels[at+2]=0;};for(let y=0;y<h;y++)black(80,y);expect(clearCellRules(pixels,w,h).hasInk).toBe(false);for(let y=8;y<=21;y++)for(let x=64;x<=72;x++){const d=((x-68)/4)**2+((y-14.5)/6.5)**2;if(d>=.45&&d<=1.1)black(x,y);}const r=clearCellRules(pixels,w,h);expect(r.hasInk).toBe(true);expect(r.width).toBeLessThan(w);expect(r.pixels.length).toBe(r.width*r.height*4);});
it('solo incorpora el cero de una celda tras lectura explícita y no rellena FICA',async()=>{const {addVerifiedZero}=await import('../src/modules/documents/zeroCells');const readings=[{confidence:90,rows:[{text:'HOLD 11.00 0.00 0.00 MED. INS',y:100,height:20},{text:'FICA',y:60,height:20}]}];addVerifiedZero(readings,100);expect(reconcilePhotoReadings(readings).text).toMatch(/MED. INS 0/);expect(readings[0].rows[1].text).toBe('FICA');});

it('ignora ruido del fondo antes del código sin mezclarlo con la columna médica',()=>{const p=recognizeIncome('Code Rate Hours Amount Code Amount Year To Date\ne j [HOLD — |$11.00| 0.00 $0.00 [MED. INS 0');expect(p.deductions.find(d=>d.categoryId==='medical')?.amount).toBe('0.00');expect(p.earnings[0].code).toBe('HOLD');});
