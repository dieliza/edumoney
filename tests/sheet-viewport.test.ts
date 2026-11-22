import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import { expect, it, vi } from 'vitest';
const code=ts.transpileModule(readFileSync('src/ui/useSheetViewport.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
function mount(available=true){
 let effect:()=>unknown=()=>{},state:any;
 const events=new Map<string,()=>void>(),frames=new Map<number,()=>void>();let serial=0;
 const viewport={height:820,offsetTop:0,addEventListener:vi.fn((k:string,f:()=>void)=>events.set(k,f)),removeEventListener:vi.fn((k:string)=>events.delete(k))};
 const exports:any={};
 runInNewContext(code,{exports,require:()=>({useState:()=>[state,(f:any)=>{state=f(state);}],useEffect:(f:()=>unknown)=>{effect=f;},useLayoutEffect:()=>{}}),document:{activeElement:null,addEventListener:vi.fn(),removeEventListener:vi.fn()},HTMLElement:class {},window:available?{visualViewport:viewport}:{},requestAnimationFrame:(f:()=>void)=>{frames.set(++serial,f);return serial;},cancelAnimationFrame:(id:number)=>frames.delete(id)});
 exports.useSheetViewport();const cleanup=effect();
 const flush=()=>{const callbacks=[...frames.values()];frames.clear();callbacks.forEach(f=>f());};
 return{viewport,events,frames,flush,cleanup:cleanup as ()=>void,state:()=>state};
}
it('tracks keyboard opening and Safari pan while retaining the viewport on close',()=>{const t=mount();t.flush();expect(t.state()).toEqual({height:820,top:0});t.viewport.height=450;t.viewport.offsetTop=180;t.events.get('resize')!();t.events.get('scroll')!();expect(t.frames.size).toBe(1);t.flush();expect(t.state()).toEqual({height:450,top:180});t.viewport.height=820;t.viewport.offsetTop=0;t.events.get('resize')!();t.flush();expect(t.state()).toEqual({height:820,top:0});t.cleanup();});
it('does not rerender unchanged geometry and removes all listeners and scheduled work on close',()=>{const t=mount();t.flush();const previous=t.state();t.events.get('scroll')!();t.flush();expect(t.state()).toBe(previous);t.events.get('resize')!();t.cleanup();expect(t.frames.size).toBe(0);expect(t.events.size).toBe(0);});
it('leaves native and older browsers on their existing layout when visualViewport is unavailable',()=>{const t=mount(false);expect(t.state()).toBeUndefined();expect(t.frames.size).toBe(0);expect(t.viewport.addEventListener).not.toHaveBeenCalled();});

function fieldFixture({fieldTop=500,fieldBottom=550,areaTop=100,areaBottom=350,inside=true,editable=true}={}) {
 const scroller={scrollTop:60,getBoundingClientRect:()=>({top:areaTop,bottom:areaBottom})};
 class Input {matches(){return editable;}closest(){return inside?scroller:null;}getBoundingClientRect(){return{top:fieldTop,bottom:fieldBottom};}}
 const exports:any={};
 runInNewContext(code,{exports,require:()=>({}),document:{activeElement:new Input()},HTMLElement:Input});
 exports.revealSheetInput();return scroller.scrollTop;
}
it('reveals the expense input hidden below the keyboard by scrolling only the sheet',()=>{expect(fieldFixture()).toBe(272);});
it('keeps an already visible input stationary and reveals one hidden above the save header',()=>{expect(fieldFixture({fieldTop:130,fieldBottom:180})).toBe(60);expect(fieldFixture({fieldTop:90,fieldBottom:140})).toBe(38);});
it('does not move unrelated inputs or category wheel focus',()=>{expect(fieldFixture({inside:false})).toBe(60);expect(fieldFixture({editable:false})).toBe(60);});
