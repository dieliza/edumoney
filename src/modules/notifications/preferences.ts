export type InboxPreferences={enabled:boolean;read:string[]};
export class NotificationPreferences{
 private queue:Promise<unknown>=Promise.resolve();private key:string;
 constructor(private storage:{getItem(key:string):Promise<string|null>;setItem(key:string,value:string):Promise<void>},scope:string){if(!scope)throw Error('Abre tu espacio antes de usar la bandeja.');this.key=`edumoney-inbox-v1:${scope}`;}
 private async load():Promise<InboxPreferences>{const raw=await this.storage.getItem(this.key);if(!raw)return {enabled:true,read:[]};try{const p=JSON.parse(raw);return {enabled:p.enabled!==false,read:Array.isArray(p.read)?[...new Set(p.read.filter((id:unknown)=>typeof id==='string'))] as string[]:[]};}catch{return {enabled:true,read:[]};}}
 read(){return this.queue.then(()=>this.load());}
 update(change:(p:InboxPreferences)=>InboxPreferences){const next=this.queue.then(async()=>{const p=change(await this.load());await this.storage.setItem(this.key,JSON.stringify(p));return p;});this.queue=next.catch(()=>undefined);return next;}
}
