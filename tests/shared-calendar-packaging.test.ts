import { createRequire } from 'node:module';
import { describe, it, expect } from 'vitest';
const require = createRequire(import.meta.url);
const promote = require('../web-enhancements/funds-trial/promote-shared.cjs');
function fixture() {
  const common = '/__common-a.js', lazy = '/goals-a.js';
  const factory = 'function(g,r,m,e){const ids={"store":807};m.exports=r(ids.store);}';
  const store = 'function(g,r,m,e){m.exports={saved:100};}';
  return { common, lazy, factory, store, g: { active: new Set([common,lazy]), defs: new Map([[806,{asset:lazy,factory,deps:[]}],[807,{asset:lazy,factory:store,deps:[]}]]) }, patched: new Map([[common,''],[lazy,`__d(${factory},806,[]);\n__d(${store},807,[]);`]]) };
}
describe('shared calendar packaging',()=>{
 it('registers the complete lazy store closure before the first Bills render without changing factories',()=>{
  const f=fixture();
  const load=(source:string)=>{const modules=new Map<number,Function>(),r=(id:number):any=>{if(!modules.has(id))throw Error('Unknown '+id);const m={exports:{}};modules.get(id)!(null,r,m,m.exports);return m.exports;};new Function('__d',source)((factory:Function,id:number)=>modules.set(id,factory));return r;};
  expect(()=>load(f.patched.get(f.common)!) (806)).toThrow('Unknown 806');
  const result=promote(f.g,f.patched,[806]);
  expect(result.moved).toEqual([806,807]);expect(load(f.patched.get(f.common)!)(806)).toEqual({saved:100});
  expect(f.patched.get(f.lazy)?.trim()).toBe('');expect(f.patched.get(f.common)).toContain(f.factory);expect(f.patched.get(f.common)).toContain(f.store);
 });
 it('leaves dependencies already shared unchanged',()=>{const f=fixture();for(const d of f.g.defs.values())d.asset=f.common;const before=[...f.patched];expect(promote(f.g,f.patched,[806]).moved).toEqual([]);expect([...f.patched]).toEqual(before);});
 it('rejects a missing transitive dependency at packaging time',()=>{const f=fixture();f.g.defs.delete(807);expect(()=>promote(f.g,f.patched,[806])).toThrow('Missing shared dependency 807');});
});
