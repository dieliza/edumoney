import { UserInputError } from '../../core/errors';
import { MoneyStore } from '../money/store';
import { findLesson } from './content';
import { simulate,type ScenarioInput } from '../decisions/domain';
export interface Completion {lessonId:string;version:number;completedAt:string}
export interface SavedScenario {id:string;name:string;kind:ScenarioInput['kind'];input:ScenarioInput;formulaVersion:number;createdAt:string}
export interface LearningSnapshot {completed:Completion[];scenarios:SavedScenario[];attempts:{lessonId:string;correct:boolean}[]}
export class LearningStore {
 constructor(private ledger:MoneyStore){}
 async snapshot():Promise<LearningSnapshot>{return this.ledger.read(async db=>({completed:await db.getAllAsync('SELECT lesson_id AS lessonId,lesson_version AS version,completed_at AS completedAt FROM lesson_progress'),attempts:(await db.getAllAsync<{lessonId:string;correct:number}>('SELECT lesson_id AS lessonId,correct FROM lesson_attempts')).map(a=>({...a,correct:!!a.correct})),scenarios:(await db.getAllAsync<{id:string;name:string;kind:ScenarioInput['kind'];json:string;formulaVersion:number;createdAt:string}>('SELECT id,name,kind,input_json AS json,formula_version AS formulaVersion,created_at AS createdAt FROM decision_scenarios ORDER BY rowid DESC')).map(s=>({id:s.id,name:s.name,kind:s.kind,input:JSON.parse(s.json),formulaVersion:s.formulaVersion,createdAt:s.createdAt}))}));}
 async answer(id:string,lessonId:string,answer:number){const l=findLesson(lessonId);if(!id||!l||!Number.isInteger(answer)||answer<0||answer>=l.options.length)throw new UserInputError('Selecciona una respuesta válida.');return this.ledger.transaction(async db=>{
 const old=await db.getFirstAsync<{lesson:string;version:number;answer:number}>('SELECT lesson_id AS lesson,lesson_version AS version,answer FROM lesson_attempts WHERE id=?',id);if(old){if(old.lesson===l.id&&old.version===l.version&&old.answer===answer)return answer===l.correct;throw new UserInputError('El identificador ya corresponde a otro ejercicio.');}
 const correct=answer===l.correct,now=new Date().toISOString();await db.runAsync('INSERT INTO lesson_attempts(id,lesson_id,lesson_version,answer,correct,recorded_at) VALUES(?,?,?,?,?,?)',id,l.id,l.version,answer,Number(correct),now);
 if(correct)await db.runAsync('INSERT OR IGNORE INTO lesson_progress(lesson_id,lesson_version,completed_at) VALUES(?,?,?)',l.id,l.version,now);return correct;
 });}
 async setPending(lessonId:string){const l=findLesson(lessonId);if(!l)throw new UserInputError('Lección no encontrada.');return this.ledger.transaction(async db=>{await db.runAsync('DELETE FROM lesson_progress WHERE lesson_id=? AND lesson_version=?',l.id,l.version);});}
 async saveScenario(id:string,name:string,input:ScenarioInput){simulate(input);name=name.trim();if(!id||!name||name.length>80)throw new UserInputError('Nombra el escenario (hasta 80 caracteres).');const json=JSON.stringify(input);return this.ledger.transaction(async db=>{
 const old=await db.getFirstAsync<{name:string;json:string}>('SELECT name,input_json AS json FROM decision_scenarios WHERE id=?',id);if(old){if(old.name===name&&old.json===json)return;throw new UserInputError('El identificador pertenece a otro escenario.');}
 await db.runAsync('INSERT INTO decision_scenarios(id,name,kind,input_json,formula_version,created_at) VALUES(?,?,?,?,?,?)',id,name,input.kind,json,1,new Date().toISOString());
 });}
 async deleteScenario(id:string){return this.ledger.transaction(async db=>{await db.runAsync('DELETE FROM decision_scenarios WHERE id=?',id);});}
}
