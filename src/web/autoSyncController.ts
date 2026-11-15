export type AutoSyncStatus={state:'waiting'|'saving'|'saved'|'error'|'conflict'|'disabled';message:string;lastSuccess?:number};
/** One operation at a time; commits during upload remain dirty. Retry without replacing conflicts. */
export class AutoSyncController{
 private dirty=true;private working=false;private stopped=false;private timer:ReturnType<typeof setTimeout>|undefined;
 constructor(private enabled:()=>Promise<boolean>,private sync:()=>Promise<{message:string;conflict?:unknown}>,private changed:(status:AutoSyncStatus)=>void){}
 schedule(delay=1800){if(this.stopped)return;this.dirty=true;if(!this.timer)this.timer=setTimeout(()=>{this.timer=undefined;void this.flush();},delay);}
 async flush(){if(this.stopped||this.working||!this.dirty)return;if(this.timer){clearTimeout(this.timer);this.timer=undefined;}this.working=true;this.dirty=false;
 try{const enabled=await this.enabled();if(this.stopped)return;if(!enabled){this.changed({state:'disabled',message:'Respaldo automático desactivado en este dispositivo.'});return;}this.changed({state:'saving',message:'Guardando copia cifrada…'});const result=await this.sync();if(this.stopped)return;if(result.conflict){this.dirty=true;this.changed({state:'conflict',message:'Hay copias distintas. Abre Sincronización para revisarlas; ninguna se reemplazó.'});}else this.changed({state:'saved',message:'Copia cifrada actualizada.',lastSuccess:Date.now()});}
 catch{this.dirty=true;if(!this.stopped)this.changed({state:'error',message:'Respaldo remoto pendiente. Tus registros locales siguen guardados; se reintentará con conexión.'});}
 finally{this.working=false;}
 }
 stop(){this.stopped=true;if(this.timer)clearTimeout(this.timer);}
}
