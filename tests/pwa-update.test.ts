import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {expect,it,vi} from 'vitest';
const source=readFileSync('scripts/pwa-register.js','utf8');
function environment({waiting=true,controller=true,offline=false}={}){
 const windowEvents:Record<string,()=>Promise<void>|void>={},swEvents:Record<string,()=>void>={},regEvents:Record<string,()=>void>={},workerEvents:Record<string,()=>void>={};
 type Node={textContent:string;children:Node[];events:Record<string,()=>void>;style:{cssText:string};append(...children:Node[]):void;setAttribute():void;addEventListener(name:string,fn:()=>void):void};
 const node=():Node=>({textContent:'',children:[],events:{},style:{cssText:''},append(...children){this.children.push(...children);},setAttribute(){},addEventListener(name,fn){this.events[name]=fn;}});
 const body=node(),reload=vi.fn(),postMessage=vi.fn(),update=vi.fn().mockResolvedValue(undefined);
 const registration={waiting:waiting?{postMessage}:null,installing:{state:'installing',addEventListener:(name:string,fn:()=>void)=>{workerEvents[name]=fn;}},update,addEventListener:(name:string,fn:()=>void)=>{regEvents[name]=fn;}};
 const register=offline?vi.fn().mockRejectedValue(Error('offline')):vi.fn().mockResolvedValue(registration);
 const serviceWorker={controller:controller?{}:null,register,addEventListener:(name:string,fn:()=>void)=>{swEvents[name]=fn;}};
 runInNewContext(source,{navigator:{serviceWorker},window:{location:{reload},addEventListener:(name:string,fn:()=>Promise<void>)=>{windowEvents[name]=fn;}},document:{body,createElement:node}});
 return {windowEvents,swEvents,regEvents,workerEvents,registration,register,body,reload,postMessage,update};
}
it('avisa de una versión pendiente sin recargar ni descartar un formulario',async()=>{
 const e=environment();await e.windowEvents.load();expect(e.body.children).toHaveLength(1);expect(e.reload).not.toHaveBeenCalled();expect(e.register).toHaveBeenCalledWith('/sw.js',{updateViaCache:'none'});expect(e.update).toHaveBeenCalledOnce();
});
it('activa y recarga solo tras pulsar Actualizar, una sola vez',async()=>{
 const e=environment();await e.windowEvents.load();e.body.children[0].children[1].events.click();expect(e.postMessage).toHaveBeenCalledWith({type:'EDUMONEY_ACTIVATE_UPDATE'});expect(e.reload).not.toHaveBeenCalled();e.swEvents.controllerchange();e.swEvents.controllerchange();expect(e.reload).toHaveBeenCalledOnce();
});
it('una actualización desde otra pestaña no recarga la pestaña sin permiso',async()=>{
 const e=environment({waiting:false});await e.windowEvents.load();e.swEvents.controllerchange();expect(e.body.children).toHaveLength(1);expect(e.reload).not.toHaveBeenCalled();e.body.children[0].children[1].events.click();expect(e.reload).toHaveBeenCalledOnce();
});
it('no muestra un aviso ficticio en la primera instalación y detecta una actualización posterior',async()=>{
 const first=environment({controller:false});await first.windowEvents.load();expect(first.body.children).toHaveLength(0);
 const e=environment({waiting:false});await e.windowEvents.load();e.regEvents.updatefound();e.registration.installing.state='installed';e.registration.waiting={postMessage:e.postMessage};e.workerEvents.statechange();expect(e.body.children).toHaveLength(1);
});
it('sin conexión mantiene la app abierta y no usa mecanismos para borrar los datos privados',async()=>{
 const e=environment({offline:true});await e.windowEvents.load();expect(e.reload).not.toHaveBeenCalled();expect(e.body.children).toHaveLength(0);expect(source).not.toMatch(/indexedDB|localStorage|\.clear\(|\.delete\(/); // La actualización solo controla código.
 const build=readFileSync('scripts/build-web.mjs','utf8');expect(build).toContain('/register-sw.js?build=');expect(build).toContain("e.data?.type==='EDUMONEY_ACTIVATE_UPDATE'");
});
