import {expect,it} from 'vitest';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const require=createRequire(import.meta.url);
it('la integración del calendario conserva la búsqueda y las operaciones previas de facturas',()=>{const old=JSON.parse(readFileSync('docs/stages/evidence/goal-calendar-inspection.json','utf8')).find((m:{id:number})=>m.id===849).factory;const patched=require('../web-enhancements/goal-calendar/patch-calendar.cjs')(old);const sf=ts.createSourceFile('bill.js','('+patched+')',ts.ScriptTarget.Latest,true);expect((sf as unknown as {parseDiagnostics:unknown[]}).parseDiagnostics).toHaveLength(0);expect(patched).toContain("useSearchLanding('billId'");expect(patched).toContain('_r(39000).GoalCalendar');expect(patched).toContain('goalCalendarView');const undo=patched.replace('const{scope:A,view:goalCalendarView}','const{scope:A}').replace("useState)(goalCalendarView==='calendar'?'calendar':'upcoming')","useState)('upcoming')").replace(",S?null:('calendar'===H||'upcoming'===H)?(0,b.jsx)(_r(39000).GoalCalendar,{month:'calendar'===H?z:undefined,upcoming:'upcoming'===H}):null",'');expect(undo).toBe(old);});
