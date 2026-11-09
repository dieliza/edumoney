export interface VoiceSession {stop():void;abort():void}
export async function startDictation(_onText:(text:string)=>void,onMessage:(text:string)=>void,_onEnd:()=>void,_active:()=>boolean=()=>true):Promise<VoiceSession|null>{onMessage('El dictado local requiere la aplicación nativa y un modelo compatible.');return null;}
