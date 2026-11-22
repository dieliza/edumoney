import {UserInputError} from '../../core/errors';
import type {SqlDb} from '../money/store';
import type {LedgerMovement} from '../money/types';
/** Called inside the document transaction so financial and commercial records commit together. */
export async function linkCaptureCommercial(db:SqlDb,m:LedgerMovement,holderId:string){
 if(!await db.getFirstAsync("SELECT id FROM business_holders WHERE id=? AND legal_form IN ('individual','llc')",holderId))throw new UserInputError('Selecciona tu DBA o LLC en Negocio.');
 const projectId=`commercial-general:${holderId}`,entryId=`commercial-entry:${m.id}`;
 const project=await db.getFirstAsync<{id:string}>("SELECT id FROM business_projects WHERE holder_id=? AND (id=? OR lower(trim(name))='actividad comercial') ORDER BY rowid LIMIT 1",holderId,projectId);
 if(!project)await db.runAsync('INSERT INTO business_projects(id,holder_id,dba_id,name) VALUES(?,?,NULL,?)',projectId,holderId,'Actividad comercial');
 await db.runAsync("INSERT INTO business_entries(id,holder_id,movement_id,kind,movement_version,use_kind,business_bps,justification,cpa_status,gross_cents,commission_cents,refund_cents,ivu_cents,updated_at) VALUES(?,?,?,?,?,'business',NULL,?,'pending',NULL,NULL,NULL,NULL,?)",entryId,holderId,m.id,m.kind,m.version,'Cuenta Comercial confirmada por el usuario',m.updatedAt);
 await db.runAsync('INSERT INTO business_allocations(entry_id,holder_id,project_id,amount_cents) VALUES(?,?,?,?)',entryId,holderId,project?.id??projectId,m.amountCents);
}
