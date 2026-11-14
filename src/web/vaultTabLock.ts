export type VaultOpenOptions={waitForOtherTab?:boolean;signal?:AbortSignal;onWaiting?():void};
const busyMessage='EduMoney está abierto en otra pestaña. Cierra la otra pestaña de EduMoney y vuelve a entrar aquí. No cambies tu contraseña.';
/** La exclusión sigue siendo del navegador: nunca se roba ni se libera el bloqueo de otra pestaña. */
export async function acquireVaultTab(options:VaultOpenOptions={}):Promise<()=>Promise<void>>{
 if(!navigator.locks)throw Error('Este navegador no permite proteger los datos entre pestañas. Actualízalo para continuar.');
 function request(requestOptions:LockOptions):Promise<(()=>Promise<void>)|null>{return new Promise((resolve,reject)=>{
  let release!:()=>void;const held=new Promise<void>(done=>{release=done;});
  const completed=navigator.locks.request('edumoney-vault-session',requestOptions,async lock=>{if(!lock){resolve(null);return;}resolve(async()=>{release();await completed;});await held;});
  void completed.catch(reject);
 });}
 options.signal?.throwIfAborted();
 const immediate=await request({ifAvailable:true});if(immediate){if(options.signal?.aborted){await immediate();options.signal.throwIfAborted();}return immediate;}
 if(!options.waitForOtherTab)throw Error(busyMessage);
 options.onWaiting?.();const controller=new AbortController();let timedOut=false;
 const cancel=()=>controller.abort();options.signal?.addEventListener('abort',cancel,{once:true});if(options.signal?.aborted)cancel();
 const timer=setTimeout(()=>{timedOut=true;controller.abort();},30000);
 try{const release=await request({signal:controller.signal});if(!release)throw Error(busyMessage);return release;}
 catch(error){if(controller.signal.aborted)throw Error(timedOut?busyMessage:'Se canceló la espera. Puedes volver a entrar.');throw error;}
 finally{clearTimeout(timer);options.signal?.removeEventListener('abort',cancel);}
}
