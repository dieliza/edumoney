/** Local refresh signal only: no financial text, network or OS notification permissions. */
const listeners=new Set<()=>void>();
export function onInboxChanged(listener:()=>void){listeners.add(listener);return()=>{listeners.delete(listener);};}
export function notifyInboxChanged(){for(const listener of listeners){try{listener();}catch{/* Persistence must not fail because a view could not refresh. */}}}
