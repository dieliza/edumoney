import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {announceSaved,beginSaveAction,getSaveNotice,subscribeSaveNotice} from '../src/ui/saveFeedback';
beforeEach(()=>{vi.useFakeTimers();vi.advanceTimersByTime(6000);});
afterEach(()=>{vi.advanceTimersByTime(6000);vi.useRealTimers();});
it('pulsar Guardar no confirma nada hasta anunciar la persistencia real',()=>{const ticket=beginSaveAction('Guardar categoría');expect(ticket).not.toBeNull();expect(getSaveNotice()).toBeNull();announceSaved();expect(getSaveNotice()).toMatchObject({ticket,text:'Guardado exitosamente'});});
it('una operación rechazada no muestra éxito',async()=>{beginSaveAction('Guardar cheque');try{await Promise.reject(Error('validation'));announceSaved();}catch{}expect(getSaveNotice()).toBeNull();});
it('conserva la confirmación tras cerrar el formulario y la retira después de cinco segundos',()=>{beginSaveAction('Guardar ingreso');announceSaved();expect(getSaveNotice()?.text).toBe('Guardado exitosamente');vi.advanceTimersByTime(4999);expect(getSaveNotice()).not.toBeNull();vi.advanceTimersByTime(1);expect(getSaveNotice()).toBeNull();});
it('vincula la confirmación al botón correcto y tolera observadores que fallan',()=>{const off=subscribeSaveNotice(()=>{throw Error('unmounted');});try{const first=beginSaveAction('Guardar gasto');announceSaved();const second=beginSaveAction('Guardar categoría');announceSaved();expect(getSaveNotice()?.ticket).toBe(second);expect(second).not.toBe(first);}finally{off();}});
