import {expect,it} from 'vitest';
import {moneyKeystroke,moneyDisplay} from '../src/ui/moneyInput';
import {documentMatches,validDocumentRange} from '../src/modules/documents/filters';
import type {StoredDocument} from '../src/modules/documents/types';
const doc={description:'Gasolinera FICTICIA',date:'2026-11-13'} as StoredDocument;
it('mueve los centavos sin aritmética binaria al añadir y retirar dígitos',()=>{
 expect(moneyKeystroke('1')).toBe('0.01');expect(moneyKeystroke('0.010')).toBe('0.10');expect(moneyKeystroke('0.100')).toBe('1.00');expect(moneyKeystroke('1.0')).toBe('0.10');expect(moneyKeystroke('')).toBe('');
});
it('conserva céntimos y muestra los valores existentes con dos decimales',()=>{
 expect(moneyDisplay('100')).toBe('100.00');expect(moneyDisplay('55.5')).toBe('55.50');expect(moneyKeystroke('$1,234.56')).toBe('1234.56');expect(moneyKeystroke('0000')).toBe('0.00');
});
it('filtra documentos por búsqueda y fechas inclusivas',()=>{
 expect(documentMatches(doc,'gasolinera','2026-11-13','2026-11-13')).toBe(true);
 expect(documentMatches(doc,'otro','','')).toBe(false);expect(documentMatches(doc,'','2026-11-14','')).toBe(false);expect(documentMatches(doc,'','','2026-11-12')).toBe(false);
});
it('admite rangos abiertos y rechaza fechas invertidas sin inventar fecha a un documento',()=>{
 expect(validDocumentRange('','2026-11-13')).toBe(true);expect(validDocumentRange('2026-12-01','2026-11-01')).toBe(false);expect(validDocumentRange('2026-02-30','')).toBe(false);
 expect(documentMatches({...doc,date:null},'','','')).toBe(true);expect(documentMatches({...doc,date:null},'','2026-01-01','')).toBe(false);
});
it('calcula el ingreso sin un segundo campo neto y no supone cero si faltan retenciones',async()=>{
 const {incomeFromBreakdown}=await import('../src/modules/money/incomeInput');
 expect(incomeFromBreakdown('1000.00','125.25')).toBe(87475);
 expect(incomeFromBreakdown('1000.00','0.00')).toBe(100000);
 expect(()=>incomeFromBreakdown('1000.00','')).toThrow('un blanco no significa cero');
 expect(()=>incomeFromBreakdown('1000.00','1001.00')).toThrow('positivo');
});
it('activa calendario para fechas y rangos sin afectar búsquedas, porcentajes ni meses',async()=>{
 const {isCalendarField}=await import('../src/ui/dateInput');
 for(const label of ['Desde (AAAA-MM-DD, opcional)','Hasta (AAAA-MM-DD, opcional)','Fecha del pago','Fecha real AAAA-MM-DD','Vencimiento (AAAA-MM-DD)','Inicio del período'])expect(isCalendarField(label)).toBe(true);
 for(const label of ['Porcentaje comercial (hasta dos decimales)','Buscar registro por fecha o descripción','Descripción','Mes (AAAA-MM)','Año contributivo','Primer mes del escenario (AAAA-MM)'])expect(isCalendarField(label)).toBe(false);
});
