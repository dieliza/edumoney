import {taxRuleRequest} from '../../web/accountService';
import type {VerifiedRule} from './domain';
export async function rules(jurisdiction:string,year:number):Promise<VerifiedRule|undefined>{const r=await fetch('https://edumoney-web.diegoluissantospabon.chatgpt.site/api/tax-rules/rules?jurisdiction='+encodeURIComponent(jurisdiction)+'&year='+year);if(!r.ok)throw Error('Las reglas están pendientes de validación.');const data=await r.json();return data.status==='approved'?data:undefined;}
export async function activateResearch(jurisdiction:string,year:number){return taxRuleRequest({jurisdiction,year});}
