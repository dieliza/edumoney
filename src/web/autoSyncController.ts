import {syncDiagnostic,type SyncErrorCode} from './syncErrors';
export type AutoSyncStatus={state:'waiting'|'saving'|'saved'|'error'|'conflict'|'disabled';message:string;lastSuccess?:number;errorCode?:SyncErrorCode};
/** One operation at a time; commits during upload remain dirty. Retry without replacing conflicts. */
export class AutoSyncController{
 private pendingFailure=false;private lastStatus:AutoSyncStatus|undefined;
 private emit(status:AutoSyncStatus){if(status.state!=='saved'&&this.lastStatus?.state===status.state&&this.lastStatus.message===status.message)return;this.lastStatus=status;this.changed(status);}
 private dirty=true;private working=false;private stopped=false;private timer:ReturnType<typeof setTimeout>|undefined;
 constructor(private enabled:()=>Promise<boolean>,private sync:()=>Promise<{message:string;conflict?:unknown}>,private changed:(status:AutoSyncStatus)=>void){}
 schedule(delay=1800){if(this.stopped)return;this.dirty=true;if(!this.timer)this.timer=setTimeout(()=>{this.timer=undefined;void this.flush();},delay);}
 async flush(){if(this.stopped||this.working||!this.dirty)return;if(this.timer){clearTimeout(this.timer);this.timer=undefined;}this.working=true;this.dirty=false;
 try{const enabled=await this.enabled();if(this.stopped)return;if(!enabled){this.emit({state:'disabled',message:'Respaldo automático desactivado en este dispositivo.'});return;}if(!this.pendingFailure)this.emit({state:'saving',message:'Guardando copia cifrada…'});const result=await this.sync();if(this.stopped)return;if(result.conflict){this.dirty=true;this.pendingFailure=true;this.emit({state:'conflict',message:'Hay copias distintas. Abre Sincronización para revisarlas; ninguna se reemplazó.'});}else{this.pendingFailure=false;this.emit({state:'saved',message:'Copia cifrada actualizada.',lastSuccess:Date.now()});}}
 catch(error){this.dirty=true;this.pendingFailure=true;const detail=syncDiagnostic(error);if(!this.stopped)this.emit({state:detail.code==='conflict'?'conflict':'error',message:detail.message,errorCode:detail.code});}
 finally{this.working=false;}
 }
 stop(){this.stopped=true;if(this.timer)clearTimeout(this.timer);}
}
