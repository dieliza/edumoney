const listeners=new Set<()=>void>();
export function onDataCommitted(listener:()=>void){listeners.add(listener);return()=>{listeners.delete(listener);};}
/** A backup trigger must never turn a successful local commit into an error. */
export function notifyDataCommitted(){for(const listener of listeners){try{listener();}catch{/* Local persistence remains authoritative. */}}}
