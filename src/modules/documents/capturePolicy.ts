import type {Category} from '../money/types';
import type {EntryDirection} from '../money/entryContext';
import type {Source} from './types';
export const CAPTURE_DATA_ONLY=true;
export const captureSourceLabel:Record<Source,string>={camera:'Foto de cámara',library:'Foto de galería',voice:'Dictado por voz',manual:'Texto escrito'};
const normalize=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
/** Reuse existing financial categories; capture channel is never a category. */
export function captureCategory(categories:Category[],direction:EntryDirection|'',documentType?:string){const active=categories.filter(c=>c.kind===direction&&!c.archived);if(direction==='income'&&documentType==='paystub'){const salary=active.find(c=>['salario','sueldo','nomina'].includes(normalize(c.name)));if(salary)return salary;}return active.find(c=>normalize(c.name)===(direction==='income'?'otros ingresos':'otros gastos'));}
