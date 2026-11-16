import type {SqlDb} from '../money/store';
import type {LedgerMovement} from '../money/types';
import {UserInputError} from '../../core/errors';
import {assessExpense,emptyExpenseAnswers,validateExpenseAnswers,type ExpenseAnswers,type ExpenseGuidance,type GuideProfile,emptyGuideProfile} from './expenseGuide';
export interface SavedExpenseGuide {movementId:string;sourceVersion:number;description:string;guidance:ExpenseGuidance;recordedAt:string}
/** Additive typed events in the existing encrypted audit stream, included in existing backups. */
export async function recordExpenseGuide(db:Pick<SqlDb,'runAsync'>,m:Pick<LedgerMovement,'id'|'kind'|'version'|'date'|'description'>,answers:ExpenseAnswers=emptyExpenseAnswers()){
 if(m.kind!=='expense')return;validateExpenseAnswers(answers);const value:SavedExpenseGuide={movementId:m.id,sourceVersion:m.version,description:m.description,guidance:assessExpense(Number(m.date.slice(0,4)),m.description,answers),recordedAt:new Date().toISOString()};
 await db.runAsync('INSERT INTO tax_events(entity_id,action,reason,before_json,recorded_at) VALUES(?,?,?,?,?)',m.id,'expense_guidance_v1','Orientación de gasto; no determina una deducción',JSON.stringify(value),value.recordedAt);
}
export async function readExpenseGuides(db:SqlDb,year:number){const rows=await db.getAllAsync<{json:string}>("SELECT before_json AS json FROM tax_events WHERE id IN (SELECT MAX(id) FROM tax_events WHERE action='expense_guidance_v1' GROUP BY entity_id) ORDER BY id");return rows.map(r=>JSON.parse(r.json) as SavedExpenseGuide).filter(r=>r.guidance.year===year);}
export async function readGuideProfile(db:SqlDb,year:number){const row=await db.getFirstAsync<{json:string}>("SELECT before_json AS json FROM tax_events WHERE entity_id=? AND action='guide_profile_v1' ORDER BY id DESC LIMIT 1",`guide-profile:${year}`);return row?JSON.parse(row.json) as GuideProfile:null;}
export function validateGuideProfile(p:GuideProfile){if(!p||Object.keys(p).some(key=>!(key in emptyGuideProfile(p.year)))||!Number.isInteger(p.year)||p.year<1900||p.year>9999||!['unknown','under26','26to64','65plus'].includes(p.ageBand)||[p.business,p.medical,p.mortgage,p.studentLoan,p.donations,p.retirement].some(v=>!['yes','no','unknown'].includes(v))||[p.household,p.children].some(v=>typeof v!=='string'||v!==''&&!/^\d{1,2}$/.test(v))||typeof p.familyNotes!=='string'||p.familyNotes.length>1000||p.children!==''&&p.household!==''&&Number(p.children)>Number(p.household))throw new UserInputError('Revisa los datos del perfil de orientación.');}
