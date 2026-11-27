import {contributionOccurrences,recommendedFirstDate,type ContributionGoal} from '../budget/contributions';
import {goalRace} from './race';
import {validDate} from '../money/domain';
import type {Goal} from './types';
export interface GoalCalendarEntry{id:string;goalId:string;name:string;date:string;index:number;amountCents:number;paidCents:number;remainingCents:number;complete:boolean}
export function goalCalendarEntries(goals:Goal[],from:string,to:string):GoalCalendarEntry[]{return goals.flatMap(g=>{
 if(g.archived||!g.desiredDate||!validDate(g.desiredDate))return[];
 const start=g.trackStartDate&&validDate(g.trackStartDate)?g.trackStartDate:from,frequency=g.cadence==='biweekly'?'semimonthly':g.cadence;
 const plan:ContributionGoal={targetCents:g.targetCents,firstDate:recommendedFirstDate(start,frequency,g.desiredDate),dueDate:g.desiredDate,frequency},race=goalRace(g,start);
 return contributionOccurrences(plan,from,to).filter(x=>x.index<race.count).map(x=>{const stage=race.stage(x.index+1);return{id:'edumoney-goal:'+g.id+':'+x.date,goalId:g.id,name:g.name,date:x.date,index:x.index+1,amountCents:stage.amount,paidCents:stage.paid,remainingCents:stage.amount-stage.paid,complete:stage.complete};});
 }).sort((a,b)=>a.date.localeCompare(b.date)||a.id.localeCompare(b.id));}
export function goalReminderPlan(goals:Goal[],now:Date){const date=new Date(now.getTime()+90*86400000);const iso=(d:Date)=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;return goalCalendarEntries(goals,iso(now),iso(date)).flatMap(e=>{const at=new Date(e.date+'T09:00:00').getTime();return !e.complete&&at>now.getTime()&&at<=now.getTime()+90*86400000?[{id:e.id,at}]:[];});}
export function mergeGoalReminders(bills:{id:string;at:number}[],goals:{id:string;at:number}[],limit=48){const all=[...new Map([...bills,...goals].map(x=>[x.id,x])).values()].sort((a,b)=>a.at-b.at||a.id.localeCompare(b.id));return{reminders:all.slice(0,limit),deferred:Math.max(0,all.length-limit)};}
export function goalCalendarFile(goal:Goal,today:string,now=new Date()){
 const entries=goal.desiredDate&&goal.desiredDate>=today?goalCalendarEntries([goal],today,goal.desiredDate).filter(e=>!e.complete):[];
 const stamp=now.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');
 const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//EduMoney//Aportaciones a metas//ES','CALSCALE:GREGORIAN',...entries.flatMap(e=>['BEGIN:VEVENT','UID:'+encodeURIComponent(e.id)+'@edumoney','DTSTAMP:'+stamp,'DTSTART:'+e.date.replaceAll('-','')+'T090000','DTEND:'+e.date.replaceAll('-','')+'T091500','SUMMARY:Aportación a una meta de EduMoney','DESCRIPTION:Revisa tu meta en EduMoney. Este recordatorio no mueve dinero.','BEGIN:VALARM','TRIGGER:PT0M','ACTION:DISPLAY','DESCRIPTION:Revisa tu aportación en EduMoney','END:VALARM','END:VEVENT']),'END:VCALENDAR'];const fold=(line:string)=>{const parts:string[]=[];let part='',bytes=0;for(const char of line){const code=char.codePointAt(0)!,size=code<128?1:code<2048?2:code<65536?3:4;if(bytes+size>73){parts.push(part);part='';bytes=0;}part+=char;bytes+=size;}parts.push(part);return parts.join('\r\n ');};return{count:entries.length,text:lines.map(fold).join('\r\n')+'\r\n'};
}
