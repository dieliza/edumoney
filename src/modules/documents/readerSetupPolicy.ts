/** Only a per-vault onboarding preference; never stores keys or document data. */
export class ReaderSetupPolicy {
 private seen=false;private generation=0;
 constructor(private storage:{getItem(key:string):Promise<string|null>;setItem(key:string,value:string):Promise<unknown>},private scope:()=>Promise<string>){}
 async load(){const generation=++this.generation;try{const key=await this.scope();const value=await this.storage.getItem('receipt-setup:'+key);if(generation===this.generation)this.seen=value==='1';}catch{/* Setup remains available if storage is unavailable. */}}
 async markSeen(){this.seen=true;++this.generation;try{await this.storage.setItem('receipt-setup:'+await this.scope(),'1');}catch{/* Current-session choice remains usable. */}}
 reset(){this.seen=false;++this.generation;}
 allow(configured:boolean,navigate:()=>void){if(configured||this.seen)return true;navigate();return false;}
}
