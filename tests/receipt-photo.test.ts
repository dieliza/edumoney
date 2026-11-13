import { expect, it } from 'vitest';
import { receiptContrast, receiptRows, receiptReadScore, chooseReceiptReading } from '../src/modules/documents/receiptImage';
import { proposeFields } from '../src/modules/documents/domain';
import { isRequiredField, isCalculationField, missingField } from '../src/ui/requiredFields';
it('marca campos vitales vacíos, acepta cero confirmado y no exige campos opcionales',()=>{
 expect(missingField('  ',isRequiredField('Cantidad objetivo'))).toBe(true);expect(missingField('0',true)).toBe(false);expect(isRequiredField('Ahorro previo ya acumulado (opcional)')).toBe(false);expect(isCalculationField('Ventas brutas USD')).toBe(true);
});
it('mantiene juntos el rótulo del total y su importe por posición',()=>{
 const text=receiptRows([{text:'$55.00',x:300,y:101,height:20},{text:'TIENDA FICTICIA',x:20,y:20,height:20},{text:'TOTAL',x:20,y:100,height:20},{text:'SUBTOTAL 50.00',x:20,y:70,height:20}]);expect(text).toBe('TIENDA FICTICIA\nSUBTOTAL 50.00\nTOTAL  $55.00');expect(proposeFields(text).amount).toBe('55.00');
});
it('distingue total real, impuesto, efectivo entregado y cambio',()=>{
 expect(proposeFields('TIENDA\nSUBTOTAL 50.00\nTOTAL IVU 5.00\nGRAND TOTAL $55.00\nEFECTIVO 60.00\nCAMBIO 5.00').amount).toBe('55.00');expect(proposeFields('TOTAL IVU 5.00\nEFECTIVO 60.00').amount).toBe('');
});
it('corrige confusiones numéricas solo en el total propuesto y avisa',()=>{
 const p=proposeFields('COMERCIO SOL\nTOTAL $I2.3O');expect(p.description).toBe('COMERCIO SOL');expect(p.amount).toBe('12.30');expect(p.warnings.some(x=>x.includes('corrección'))).toBe(true);expect(proposeFields('TOTAL 10.00\nTOTAL 12.00').amount).toBe('');
});
it('mejora contraste local sin modificar tamaño ni inventar texto',()=>{
 const pixels=new Uint8ClampedArray(20*20*4).fill(220);for(let i=0;i<400;i++)pixels[i*4+3]=255;pixels[10*20*4+10*4]=pixels[10*20*4+10*4+1]=pixels[10*20*4+10*4+2]=20;
 const result=receiptContrast(pixels,20,20);expect(result.pixels.length).toBe(pixels.length);expect(result.pixels[10*20*4+10*4]).toBe(0);expect(result.pixels[0]).toBe(255);expect(receiptReadScore('TOTAL 55.00',80)).toBeGreaterThan(receiptReadScore('ruido',80));
});

it('no acepta como confirmado un total cuando dos lecturas discrepan',()=>{expect(chooseReceiptReading([{text:'TOTAL 55.00',confidence:88},{text:'TOTAL 65.00',confidence:91}],['55.00','65.00']).needsAmountReview).toBe(true);});
