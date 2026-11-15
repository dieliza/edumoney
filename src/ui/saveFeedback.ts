export type SaveNotice={sequence:number;ticket:number|null;text:'Guardado exitosamente'};
let sequence=0,activeTicket:number|null=null,notice:SaveNotice|null=null,timer:ReturnType<typeof setTimeout>|undefined;
const listeners=new Set<()=>void>();
export function beginSaveAction(title:string){activeTicket=/\bguardar\b/i.test(title)?++sequence:null;return activeTicket;}
export function announceSaved(){clearTimeout(timer);notice={sequence:++sequence,ticket:activeTicket,text:'Guardado exitosamente'};activeTicket=null;for(const listener of listeners){try{listener();}catch{/* Feedback cannot invalidate a committed save. */}}timer=setTimeout(()=>{notice=null;for(const listener of listeners){try{listener();}catch{/* Feedback cannot invalidate a committed save. */}}},5000);}
export const getSaveNotice=()=>notice;
export const serverSaveNotice=()=>null;
export function subscribeSaveNotice(listener:()=>void){listeners.add(listener);return()=>{listeners.delete(listener);};}
