import {expect,it} from 'vitest';
import {proposeFields} from '../src/modules/documents/domain';
it('al revisar un talonario como documento usa el neto actual y no el total de deducciones',()=>{const p=proposeFields('PATRONO FICTICIO\nGross wages/period $552.58 Net wages / period $497.32\nGross wages YTD $552.58 Net wages YTD $497.32\nTotal $55.26');expect(p.amount).toBe('497.32');});
it('no usa un total de deducciones si el neto falta o está en conflicto',()=>{for(const line of ['Net wages / period [importe por confirmar]','Net wages YTD $497.32'])expect(proposeFields(`PATRONO FICTICIO\nGross wages/period $552.58\n${line}\nTotal $55.26`).amount).toBe('');});
it('distingue el orden del neto actual y el acumulado',()=>{expect(proposeFields('CURRENT YTD\nGross Pay 552.58 1000.00\nNet Pay 497.32 900.00\nTotal 55.26').amount).toBe('497.32');expect(proposeFields('YTD CURRENT\nGross Pay 1000.00 552.58\nNet Pay 900.00 497.32\nTotal 55.26').amount).toBe('497.32');});
it('conserva el total de un recibo ordinario',()=>{expect(proposeFields('TIENDA FICTICIA\nTOTAL IVU 5.26\nTOTAL 55.26\nEFECTIVO 60.00').amount).toBe('55.26');});
it('un total en conflicto sigue pendiente aunque otra fila repita una cifra',()=>{expect(proposeFields('TIENDA\nTOTAL [importe por confirmar]\nTOTAL 55.26').amount).toBe('');});
it('un talonario con dos netos actuales contradictorios no se completa por diferencia',()=>{expect(proposeFields('Gross wages/period 552.58\nNet wages/period 497.32\nNet wages/period 487.32\nTotal 55.26').amount).toBe('');});
