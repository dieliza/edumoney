import {expect,it} from 'vitest';
import {firstNameOnly,greetingAt} from '../src/modules/profile/greeting';
it.each([[0,0,'Buenos días'],[11,59,'Buenos días'],[12,0,'Buenas tardes'],[17,59,'Buenas tardes'],[18,0,'Buenas noches'],[23,59,'Buenas noches']] as const)('saluda a la hora local %s:%s', (hour,minute,word)=>{expect(greetingAt(new Date(2026,10,25,hour,minute),'Ana Pérez')).toBe('¡'+word+', Ana!');});
it('no inventa nombres para espacios sin perfil',()=>{expect(greetingAt(new Date(2026,10,25,10),'')).toBe('¡Buenos días!');expect(greetingAt(new Date(2026,10,25,22),'   ')).toBe('¡Buenas noches!');});
it('conserva acentos y usa solo el primer nombre, sin apellidos',()=>{expect(firstNameOnly('  José   Rivera Santiago ')).toBe('José');expect(firstNameOnly('Mari\u0301a Pérez')).toBe('María');expect(firstNameOnly('Ana-María López')).toBe('Ana-María');});
