import type { MoneyStore,SqlDb } from '../money/store';
import { UserInputError } from '../../core/errors';
import { schemaV1 } from '../../storage/schema';
import { schemaV2 } from '../../storage/schemaV2';
import { schemaV3 } from '../../storage/schemaV3';
import { schemaV4 } from '../../storage/schemaV4';
import { schemaV5 } from '../../storage/schemaV5';
import { schemaV6 } from '../../storage/schemaV6';
import { schemaV7 } from '../../storage/schemaV7';
import { schemaV8 } from '../../storage/schemaV8';
import { schemaV9 } from '../../storage/schemaV9';
import { schemaV10 } from '../../storage/schemaV10';
import { schemaV11 } from '../../storage/schemaV11';
export const BACKUP_TABLES_V9=[...new Set([...`${schemaV1}${schemaV2}${schemaV3}${schemaV4}${schemaV5}${schemaV6}${schemaV7}${schemaV8}${schemaV9}`.matchAll(/CREATE TABLE (\w+)/g)].map(m=>m[1]))].sort();
export const BACKUP_TABLES_V10=[...BACKUP_TABLES_V9,...[...schemaV10.matchAll(/CREATE TABLE (\w+)/g)].map(m=>m[1])].sort();
export const BACKUP_TABLES=[...BACKUP_TABLES_V10,...[...schemaV11.matchAll(/CREATE TABLE (\w+)/g)].map(m=>m[1])].sort();
const tablesFor=(schema:9|10|11)=>schema===9?BACKUP_TABLES_V9:schema===10?BACKUP_TABLES_V10:BACKUP_TABLES;
type Cell=string|number|null;
export interface BackupPayload {format:'EduMoney-local-data';schema:9|10|11;createdAt:string;tables:Record<string,{columns:string[];rows:Record<string,Cell>[]}>}
async function columns(db:SqlDb,table:string){return (await db.getAllAsync<{name:string}>(`PRAGMA table_info("${table}")`)).map(c=>c.name);}
export function validatePayload(value:unknown):asserts value is BackupPayload{const p=value as BackupPayload;if(!p||p.format!=='EduMoney-local-data'||![9,10,11].includes(p.schema)||!p.tables||typeof p.createdAt!=='string'||JSON.stringify(Object.keys(p.tables).sort())!==JSON.stringify(tablesFor(p.schema)))throw new UserInputError('Respaldo de datos incompatible con esta versión de EduMoney.');for(const table of tablesFor(p.schema)){const t=p.tables[table];if(!Array.isArray(t?.columns)||!t.columns.length||t.columns.some(c=>typeof c!=='string'||!/^\w+$/.test(c))||new Set(t.columns).size!==t.columns.length||!Array.isArray(t.rows)||t.rows.length>200000)throw new UserInputError('Estructura de respaldo no válida.');for(const row of t.rows){if(!row||Array.isArray(row)||JSON.stringify(Object.keys(row).sort())!==JSON.stringify([...t.columns].sort()))throw new UserInputError('Columnas del respaldo no válidas.');for(const cell of Object.values(row))if(cell!==null&&typeof cell!=='string'&&(typeof cell!=='number'||!Number.isSafeInteger(cell)))throw new UserInputError('Valor de respaldo no compatible.');}}}
export class BackupStore{
 constructor(private ledger:MoneyStore){}
 snapshot():Promise<BackupPayload>{return this.ledger.read(async db=>{const tables:BackupPayload['tables']={};for(const t of BACKUP_TABLES)tables[t]={columns:await columns(db,t),rows:await db.getAllAsync<Record<string,Cell>>(`SELECT * FROM "${t}" ORDER BY rowid`)};return {format:'EduMoney-local-data',schema:11,createdAt:new Date().toISOString(),tables};});}
 async restore(payload:unknown,confirmation:string){if(confirmation!=='RESTAURAR')throw new UserInputError('Escribe RESTAURAR para confirmar el reemplazo de los datos locales.');validatePayload(payload);return this.ledger.transaction(async db=>{for(const t of tablesFor(payload.schema))if(JSON.stringify(payload.tables[t].columns)!==JSON.stringify(await columns(db,t)))throw new UserInputError('Las columnas no corresponden al esquema instalado.');await db.execAsync('PRAGMA defer_foreign_keys=ON;');for(const t of BACKUP_TABLES)await db.runAsync(`DELETE FROM "${t}"`);for(const t of tablesFor(payload.schema)){const data=payload.tables[t];const sql=`INSERT INTO "${t}"(${data.columns.map(c=>`"${c}"`).join(',')}) VALUES(${data.columns.map(()=>'?').join(',')})`;for(const row of data.rows)await db.runAsync(sql,...data.columns.map(c=>row[c]));}if((await db.getAllAsync('PRAGMA foreign_key_check;')).length)throw new UserInputError('El respaldo tiene referencias incompletas. Se conservan los datos anteriores.');const integrity=await db.getFirstAsync<{integrity_check:string}>('PRAGMA integrity_check;');if(integrity?.integrity_check!=='ok')throw new UserInputError('No se pudo verificar la integridad del respaldo.');});}
}
