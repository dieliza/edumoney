import { MoneyStore } from '../money/store';
import { TaxStore } from '../tax/store';
import { UserInputError } from '../../core/errors';
import { validateClosure,type Closure } from './engine';
export interface SavedClosure {closure:Closure;fingerprint:string;version:number;updatedAt:string}
export class ClosureStore {
 constructor(private ledger:MoneyStore){}
 async source(year:number){return new TaxStore(this.ledger).snapshot(year);}
 async get(year:number){return this.ledger.read(async db=>{const r=await db.getFirstAsync<{answers:string;fingerprint:string;version:number;updatedAt:string}>('SELECT answers_json AS answers,source_fingerprint AS fingerprint,version,updated_at AS updatedAt FROM tax_closures WHERE tax_year=?',year);return r?{closure:JSON.parse(r.answers) as Closure,fingerprint:r.fingerprint,version:r.version,updatedAt:r.updatedAt}:null;});}
 async save(c:Closure,fingerprint:string,version:number,reason:string){validateClosure(c);if(!reason.trim()||reason.length>2000||!fingerprint||fingerprint.length>2000000)throw new UserInputError('Indica un motivo y vuelve a abrir el expediente.');return this.ledger.transaction(async db=>{const old=await db.getFirstAsync<{version:number;answers:string}>('SELECT version,answers_json AS answers FROM tax_closures WHERE tax_year=?',c.year);if((old?.version??0)!==version)throw new UserInputError('La entrevista cambió. Vuelve a abrirla.');for(const id of c.sourceIds)if(!await db.getFirstAsync('SELECT id FROM tax_statements WHERE id=? AND tax_year=?',id,c.year))throw new UserInputError('La referencia no pertenece al expediente de este año.');await db.runAsync('INSERT INTO tax_closure_events(tax_year,reason,before_json,recorded_at) VALUES(?,?,?,?)',c.year,reason.trim(),JSON.stringify(old),new Date().toISOString());await db.runAsync('INSERT INTO tax_closures(tax_year,answers_json,source_fingerprint,version,updated_at) VALUES(?,?,?,?,?) ON CONFLICT(tax_year) DO UPDATE SET answers_json=excluded.answers_json,source_fingerprint=excluded.source_fingerprint,version=excluded.version,updated_at=excluded.updated_at',c.year,JSON.stringify(c),fingerprint,version+1,new Date().toISOString());});}
}
