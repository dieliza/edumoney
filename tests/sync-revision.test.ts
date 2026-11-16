import {expect,it} from 'vitest';
import {normalizeSyncRevision,syncResponseRevision} from '../src/web/syncRevision';
it('prefiere la revisión de objeto estable aunque la capa HTTP cambie ETag',()=>{const r=new Response('',{headers:{'ETag':'W/"abc123"','X-EduMoney-Sync-Version':'"abc123"'}});expect(syncResponseRevision(r)).toBe('"abc123"');});
it('admite servidores anteriores con solo ETag débil, sin aceptar comodines ni listas',()=>{expect(syncResponseRevision(new Response('',{headers:{ETag:'W/"abc123"'}}))).toBe('"abc123"');for(const s of ['*','W/*','W/W/"abc"','"abc", "def"','abc','"bad/value"'])expect(normalizeSyncRevision(s)).toBeNull();});
