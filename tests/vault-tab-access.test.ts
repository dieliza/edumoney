import {beforeEach,expect,it,vi} from 'vitest';
import {IDBFactory} from 'fake-indexeddb';
import {acquireVaultTab} from '../src/web/vaultTabLock';
function locks(){let held=false;const queue:(()=>void)[]=[];return {get held(){return held;},request:async(_name:string,options:LockOptions,action:(lock:object|null)=>Promise<void>)=>{
 if(options.ifAvailable&&options.signal)throw Error('Combinación inválida de Web Locks');
 if(held&&options.ifAvailable)return action(null);
 if(held)await new Promise<void>((resolve,reject)=>{const next=()=>{options.signal?.removeEventListener('abort',abort);resolve();};const abort=()=>{const i=queue.indexOf(next);if(i>=0)queue.splice(i,1);reject(new DOMException('Aborted','AbortError'));};if(options.signal?.aborted){abort();return;}queue.push(next);options.signal?.addEventListener('abort',abort,{once:true});});
 options.signal?.throwIfAborted();held=true;try{await action({});}finally{held=false;queue.shift()?.();}
 }};}
beforeEach(()=>{vi.resetModules();vi.stubGlobal('indexedDB',new IDBFactory());vi.stubGlobal('isSecureContext',true);});
it('mantiene exclusión y permite entrar después de cerrar la pestaña anterior',async()=>{
 const manager=locks();vi.stubGlobal('navigator',{locks:manager});const release=await acquireVaultTab();await expect(acquireVaultTab()).rejects.toThrow('otra pestaña');expect(manager.held).toBe(true);await release();const next=await acquireVaultTab();expect(manager.held).toBe(true);await next();expect(manager.held).toBe(false);
});
it('avisa y espera sin robar el bloqueo; continúa al liberarlo sin otra autenticación',async()=>{
 const manager=locks();vi.stubGlobal('navigator',{locks:manager});const first=await acquireVaultTab(),onWaiting=vi.fn();const waiting=acquireVaultTab({waitForOtherTab:true,onWaiting});await vi.waitFor(()=>expect(onWaiting).toHaveBeenCalledOnce());expect(manager.held).toBe(true);await first();const second=await waiting;expect(manager.held).toBe(true);await second();
});
it('cancelar la espera no libera la pestaña activa ni deja un bloqueo fantasma',async()=>{
 const manager=locks();vi.stubGlobal('navigator',{locks:manager});const first=await acquireVaultTab(),controller=new AbortController(),onWaiting=vi.fn();const pending=acquireVaultTab({waitForOtherTab:true,signal:controller.signal,onWaiting});const rejected=expect(pending).rejects.toThrow('canceló');await vi.waitFor(()=>expect(onWaiting).toHaveBeenCalledOnce());controller.abort();await rejected;expect(manager.held).toBe(true);await first();const next=await acquireVaultTab();await next();
});
it('la espera termina con instrucciones tras treinta segundos sin retirar la protección',async()=>{
 vi.useFakeTimers();const manager=locks();vi.stubGlobal('navigator',{locks:manager});let first:(()=>Promise<void>)|undefined;
 try{first=await acquireVaultTab();const pending=acquireVaultTab({waitForOtherTab:true});const rejected=expect(pending).rejects.toThrow('Cierra la otra pestaña');await vi.advanceTimersByTimeAsync(30001);await rejected;expect(manager.held).toBe(true);}finally{await first?.();vi.useRealTimers();}
});
it('una apertura fallida libera su bloqueo y permite reintentar con la contraseña válida',async()=>{
 const manager=locks();vi.stubGlobal('navigator',{locks:manager,storage:{persist:async()=>true}});const vault=await import('../src/web/vault');await expect(vault.unlockWebVault('corta')).rejects.toThrow('12 caracteres');expect(manager.held).toBe(false);expect(vault.isWebVaultUnlocked()).toBe(false);await vault.unlockWebVault('Clave-FICTICIA-2026');expect(vault.isWebVaultUnlocked()).toBe(true);expect(manager.held).toBe(true);
});
