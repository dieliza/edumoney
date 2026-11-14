import {beforeEach,expect,it,vi} from 'vitest';
import {idleLockMinutes,setIdleLockMinutes} from '../src/web/securityPreferences';
beforeEach(()=>{const map=new Map<string,string>();vi.stubGlobal('localStorage',{getItem:(k:string)=>map.get(k)??null,setItem:(k:string,v:string)=>{map.set(k,v);}});});
it('no introduce bloqueo automático sin elegirlo y solo acepta tiempos admitidos',()=>{expect(idleLockMinutes()).toBe(0);setIdleLockMinutes(5);expect(idleLockMinutes()).toBe(5);setIdleLockMinutes(15);expect(idleLockMinutes()).toBe(15);setIdleLockMinutes(0);expect(idleLockMinutes()).toBe(0);expect(()=>setIdleLockMinutes(1)).toThrow('no válido');});
it('preferencias alteradas o almacenamiento no disponible no bloquean el acceso',()=>{localStorage.setItem('edumoney.idle-lock-minutes.v1','-1');expect(idleLockMinutes()).toBe(0);vi.stubGlobal('localStorage',{getItem:()=>{throw Error('blocked');}});expect(idleLockMinutes()).toBe(0);});
