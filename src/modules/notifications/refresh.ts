/** Coalesce changes during a read; never publish an older snapshot over a new commit. */
export function createInboxRefresh<T>(load:()=>Promise<T>,apply:(value:T)=>void,fail:()=>void){
 let disposed=false,dirty=false,running:Promise<void>|null=null;
 async function drain(){while(dirty&&!disposed){dirty=false;try{const value=await load();if(!dirty&&!disposed)apply(value);}catch{if(!dirty&&!disposed)fail();}}}
 return {request(){if(disposed)return Promise.resolve();dirty=true;if(!running)running=drain().finally(()=>{running=null;});return running;},dispose(){disposed=true;dirty=false;}};
}
