import type { MoneyStore } from '../money/store';
import { UserInputError } from '../../core/errors';
import { validateProfile } from './domain';
import type { BusinessProfile, BusinessSnapshot, Holder, BusinessDBA, BusinessProject } from './types';
const holderSelect=`SELECT id,legal_name AS legalName,legal_form AS legalForm,municipality,merchant_number AS merchantNumber,llc_jurisdiction AS llcJurisdiction,llc_members AS llcMembers,pr_classification AS prClassification,federal_classification AS federalClassification,version,updated_at AS updatedAt FROM business_holders`;
export class BusinessStore {
 constructor(private ledger: MoneyStore) {}
 snapshot(): Promise<BusinessSnapshot> { return this.ledger.read(async db=>({
  holders:await db.getAllAsync<Holder>(holderSelect+' ORDER BY rowid'),
  dbas:await db.getAllAsync<BusinessDBA>('SELECT id,holder_id AS holderId,name FROM business_dbas ORDER BY rowid'),
  projects:await db.getAllAsync<BusinessProject>('SELECT id,holder_id AS holderId,dba_id AS dbaId,name FROM business_projects ORDER BY rowid'),
 })); }
 async save(profile: BusinessProfile, expectedVersion: number) {
  validateProfile(profile);
  return this.ledger.transaction(async db=>{
   const h=profile.holder, old=await db.getFirstAsync<Holder>(holderSelect+' WHERE id=?',h.id);
   if ((old?.version??0)!==expectedVersion) throw new UserInputError('El perfil cambió. Vuelve a abrirlo antes de guardar.');
   // Los identificadores de DBA y proyecto no pueden trasladarse a otro titular.
   for (const [table,items] of [['business_dbas',profile.dbas],['business_projects',profile.projects]] as const) for (const item of items) {
    const existing=await db.getFirstAsync<{holderId:string}>(`SELECT holder_id AS holderId FROM ${table} WHERE id=?`,item.id);
    if (existing&&existing.holderId!==h.id) throw new UserInputError('Ese identificador pertenece a otro titular.');
   }
   const now=new Date().toISOString();
   if (old) {
    await db.runAsync('INSERT INTO business_profile_events(holder_id,before_json,recorded_at) VALUES(?,?,?)',h.id,JSON.stringify({holder:old,dbas:await db.getAllAsync('SELECT * FROM business_dbas WHERE holder_id=?',h.id),projects:await db.getAllAsync('SELECT * FROM business_projects WHERE holder_id=?',h.id)}),now);
    await db.runAsync('UPDATE business_holders SET legal_name=?,legal_form=?,municipality=?,merchant_number=?,llc_jurisdiction=?,llc_members=?,pr_classification=?,federal_classification=?,version=version+1,updated_at=? WHERE id=?',h.legalName.trim(),h.legalForm,h.municipality.trim(),h.merchantNumber.trim(),h.llcJurisdiction?.trim()??null,h.llcMembers,h.prClassification,h.federalClassification,now,h.id);
   } else await db.runAsync('INSERT INTO business_holders(id,legal_name,legal_form,municipality,merchant_number,llc_jurisdiction,llc_members,pr_classification,federal_classification,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?)',h.id,h.legalName.trim(),h.legalForm,h.municipality.trim(),h.merchantNumber.trim(),h.llcJurisdiction?.trim()??null,h.llcMembers,h.prClassification,h.federalClassification,now);
   for (const d of profile.dbas) await db.runAsync('INSERT INTO business_dbas(id,holder_id,name) VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name',d.id,h.id,d.name.trim());
   for (const p of profile.projects) await db.runAsync('INSERT INTO business_projects(id,holder_id,dba_id,name) VALUES(?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,dba_id=excluded.dba_id',p.id,h.id,p.dbaId,p.name.trim());
  });
 }
}
