import {UserInputError} from '../../core/errors';
import {deductionCategories,type DeductionCategory,type IncomeStatement} from './domain';
import type {MoneyStore} from '../money/store';
export class IncomeStore{
 constructor(private ledger:MoneyStore){}
 async snapshot(){return this.ledger.read(async db=>({categories:[...deductionCategories,...await db.getAllAsync<DeductionCategory>('SELECT id,name,kind FROM income_deduction_categories ORDER BY name')],statements:(await db.getAllAsync<{documentId:string;movementId:string;json:string}>('SELECT document_id AS documentId,movement_id AS movementId,record_json AS json FROM income_statements ORDER BY rowid DESC')).map(s=>({...s,statement:JSON.parse(s.json) as IncomeStatement}))}));}
 async addCategory(id:string,name:string){name=name.trim();if(!id||!name||name.length>60)throw new UserInputError('La categoría necesita un nombre de hasta 60 caracteres.');if(deductionCategories.some(c=>c.name.toLocaleLowerCase('es')===name.toLocaleLowerCase('es')))throw new UserInputError('Esa categoría ya existe.');return this.ledger.transaction(async db=>{if(await db.getFirstAsync('SELECT id FROM income_deduction_categories WHERE lower(trim(name))=lower(?)',name))throw new UserInputError('Esa categoría ya existe.');await db.runAsync("INSERT INTO income_deduction_categories(id,name,kind) VALUES(?,?,'other')",id,name);});}
}
