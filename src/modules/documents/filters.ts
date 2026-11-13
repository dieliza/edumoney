import type {StoredDocument} from './types';
import {validDate} from '../money/domain';
export function documentMatches(d:StoredDocument,search:string,from:string,to:string){
 const normalize=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es');
 return normalize(`${d.description} ${d.date??''}`).includes(normalize(search.trim())) && (!from||!!d.date&&d.date>=from) && (!to||!!d.date&&d.date<=to);
}
export function validDocumentRange(from:string,to:string){return (!from||validDate(from))&&(!to||validDate(to))&&(!from||!to||from<=to);}
