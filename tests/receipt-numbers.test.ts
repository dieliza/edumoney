import {expect,it} from 'vitest';
import {printedAmounts} from '../src/modules/documents/printedAmounts';
import {reconcilePhotoReadings} from '../src/modules/documents/photoReadings';
import {receiptBands} from '../src/modules/documents/receiptImage';
import {proposeFields} from '../src/modules/documents/domain';
import {recognizeIncome} from '../src/modules/income/recognition';
const row=(text:string,y=100)=>({text,y,height:20,confidence:90});
it('lee punto, coma, millares y espacios de impresión sin cambiar centavos',()=>{expect(printedAmounts('TOTAL $1,500.00').map(m=>m.amount)).toEqual(['1500.00']);expect(printedAmounts('TOTAL 1.500,00').map(m=>m.amount)).toEqual(['1500.00']);expect(printedAmounts('TOTAL 1 500 . 00').map(m=>m.amount)).toEqual(['1500.00']);expect(printedAmounts('TOTAL 55,00').map(m=>m.amount)).toEqual(['55.00']);});
it('no inventa decimales ausentes ni convierte palabras o identificadores en dinero',()=>{expect(printedAmounts('TOTAL 1500')).toEqual([]);expect(printedAmounts('SOL\nSSN 123-45-6789')).toEqual([]);expect(printedAmounts('Fecha 2026-11-13')).toEqual([]);});
it('corrige solo letras dentro de cantidades monetarias y mantiene la advertencia',()=>{const p=proposeFields('SOL FICTICIO\nTOTAL $I2.3O');expect(p.amount).toBe('12.30');expect(p.description).toBe('SOL FICTICIO');expect(p.warnings.join(' ')).toContain('corrección');});
it('aprovecha una segunda lectura numérica aunque las palabras de la primera tengan alta confianza',()=>{const r=reconcilePhotoReadings([{rows:[row('TIENDA FICTICIA',20),row('TOTAL')],confidence:99},{rows:[row('TOTAL $55.00')],confidence:84}]);expect(proposeFields(r.text).amount).toBe('55.00');expect(r.text).toContain('TIENDA FICTICIA');expect(r.needsAmountReview).toBe(false);});
it('no acepta dos totales incompatibles como importe confirmado',()=>{const r=reconcilePhotoReadings([{rows:[row('TOTAL 55.00')],confidence:95},{rows:[row('TOTAL 65.00')],confidence:90}]);expect(r.needsAmountReview).toBe(true);expect(proposeFields(r.text).amount).toBe('');});
it('mantiene filas y columnas actuales/acumuladas con coordenadas',()=>{const rows=receiptBands([{text:'Seguro Social',x:10,y:100,height:20},{text:'62.00 1240.00',x:300,y:102,height:20},{text:'Medicare 14.50',x:10,y:130,height:20}]);expect(rows).toHaveLength(2);expect(rows[0].text).toContain('62.00 1240.00');expect(rows[1].text).not.toContain('62.00');});
it('lee bruto, neto y deducciones con coma decimal y letras confundidas sin sumar tasas',()=>{const p=recognizeIncome('PATRONO FICTICIO\nCURRENT YTD\nGross Pay 1.500,00 18.000,00\nSocial Security 6.20% 93,00 1116,00\nMedicare I4.5O 174,00\nNet Pay 1.392,50 16.710,00');expect(p.gross).toBe('1500.00');expect(p.net).toBe('1392.50');expect(p.deductions.map(d=>d.amount)).toEqual(['93.00','14.50']);expect(p.warnings.join(' ')).toContain('corrigieron');});
it('una discrepancia entre deducciones permanece pendiente y no se sustituye por cero',()=>{const r=reconcilePhotoReadings([{rows:[row('Medicare 14.50')],confidence:95},{rows:[row('Medicare 19.50')],confidence:90}]);expect(r.needsAmountReview).toBe(true);expect(recognizeIncome(r.text).deductions[0].amount).toBe('');});

it('conserva el rótulo si otra pasada solo reconoce su columna numérica',()=>{const r=reconcilePhotoReadings([{rows:[row('TOTAL')],confidence:99},{rows:[row('55.00')],confidence:88}]);expect(proposeFields(r.text).amount).toBe('55.00');expect(r.text).toContain('TOTAL');});

it('no confunde un acumulado aislado con el importe actual si falta una columna',()=>{const p=recognizeIncome('PATRONO FICTICIO\nCURRENT YTD\nGross Pay 1500.00\nSocial Security 1116.00\nNet Pay 1392.50');expect(p.gross).toBe('');expect(p.net).toBe('');expect(p.deductions[0].amount).toBe('');expect(p.warnings.join(' ')).toContain('columnas');});
