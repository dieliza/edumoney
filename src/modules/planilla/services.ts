import type { Closure } from './engine';
export async function generateClosurePDF(_c:Closure,_mode:'review'|'laboratory'='review'):Promise<Uint8Array>{throw Error('Requiere aplicación nativa.');}
export async function shareClosurePDF(_c:Closure):Promise<void>{throw Error('Requiere aplicación nativa.');}
