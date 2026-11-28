import type {VerifiedRule} from './domain';
const origin='https://edumoney-web.diegoluissantospabon.chatgpt.site';
export async function rules(jurisdiction:string,year:number):Promise<VerifiedRule|undefined>{const r=await fetch(origin+'/api/tax-rules/rules?jurisdiction='+encodeURIComponent(jurisdiction)+'&year='+year);if(!r.ok)throw Error('Reglas pendientes de validación.');const data=await r.json();return data.status==='approved'?data:undefined;}
/** Native local accounts have no online JWT; never bypass the server's authentication. */
export async function activateResearch(_jurisdiction:string,_year:number):Promise<unknown>{throw Error('La residencia quedó guardada en este dispositivo. Para activar una jurisdicción nueva, entra con tu cuenta en EduMoney Web. Las reglas verificadas se pueden consultar aquí.');}
