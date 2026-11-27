import {createRequire} from 'node:module';
import {expect,it} from 'vitest';
const require=createRequire(import.meta.url),encode=require('../web-enhancements/goal-race/content-codec.cjs') as (data:Record<string,string>)=>{prefixes:string[];data:Record<string,string|[number,string]>;savedBytes:number};
it('comparte prefijos estáticos sin perder un solo byte ni una ruta',()=>{const prefix='AB+/0123'.repeat(4096),source={a:prefix+'AAA',b:prefix+'BBB',c:'otro'},encoded=encode(source);const restored=Object.fromEntries(Object.entries(encoded.data).map(([key,v])=>[key,Array.isArray(v)?encoded.prefixes[v[0]]+v[1]:v]));expect(restored).toEqual(source);expect(encoded.savedBytes).toBeGreaterThan(30000);});
it('conserva valores distintos y conjuntos vacíos sin introducir prefijos falsos',()=>{for(const data of [{},{a:'AAAA',b:'BBBB'}] as Record<string,string>[]){const encoded=encode(data);expect(encoded.prefixes).toEqual([]);expect(encoded.data).toEqual(data);}});
