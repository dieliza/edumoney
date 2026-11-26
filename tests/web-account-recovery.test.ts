import {beforeEach,it,expect,vi} from 'vitest';
import {IDBFactory} from 'fake-indexeddb';
import {MoneyStore} from '../src/modules/money/store';
beforeEach(()=>{vi.resetModules();vi.stubGlobal('indexedDB',new IDBFactory());vi.stubGlobal('isSecureContext',true);vi.stubGlobal('navigator',{locks:{request:async(_name:string,_options:unknown,fn:(x:object)=>unknown)=>fn({})},storage:{persist:async()=>true}});});
it('migrates an unlocked legacy vault to the stable account key without losing DB or encrypted secrets',async()=>{
 let v=await import('../src/web/vault');await v.unlockWebVault('Old-FICTITIOUS-password');await v.setWebSettings({code:'FAKE-SYNC'});await v.setWebAnthropicKey('sk-ant-FAKE');const device=await v.getOrCreateEducationDevice();
 const db=await v.webDatabase();await new MoneyStore(db).transaction(async()=>{await db.runAsync("INSERT INTO categories(id,name,kind) VALUES('recover-test','Recovery FICTITIOUS','expense')");});
 const oldFp=await v.webVaultFingerprint(),serverKey='f'.repeat(64);await v.changeUnlockedWebPassword(serverKey);const fingerprint=await v.webVaultFingerprint();await v.writeWebAccountBinding({version:1,userId:'owner-a',emailHash:'fake',fingerprint:fingerprint!});
 expect(fingerprint).not.toBe(oldFp);vi.resetModules();v=await import('../src/web/vault');await expect(v.unlockWebVault('Old-FICTITIOUS-password')).rejects.toThrow('Contraseña incorrecta');await v.unlockWebVault(serverKey);
 expect((await new MoneyStore(await v.webDatabase()).snapshot()).categories.some(c=>c.id==='recover-test')).toBe(true);expect(await v.getWebSettings()).toEqual({code:'FAKE-SYNC'});expect(await v.getWebAnthropicKey()).toBe('sk-ant-FAKE');expect(await v.getOrCreateEducationDevice()).toBe(device);expect(await v.readWebAccountBinding()).toMatchObject({userId:'owner-a'});
});
it('a wrong account key never replaces ciphertext or changes an existing owner',async()=>{
 let v=await import('../src/web/vault');await v.unlockWebVault('Original-FICTITIOUS-pass');const fingerprint=await v.webVaultFingerprint();await v.writeWebAccountBinding({version:1,userId:'owner-a',emailHash:'fake',fingerprint:fingerprint!});
 await expect(v.writeWebAccountBinding({version:1,userId:'owner-b',emailHash:'fake',fingerprint:fingerprint!})).rejects.toThrow('otra cuenta');await expect(v.changeWebPassword('wrong','New-FICTITIOUS-password','New-FICTITIOUS-password')).rejects.toThrow('actual no coincide');
 vi.resetModules();v=await import('../src/web/vault');await expect(v.unlockWebVault('e'.repeat(64))).rejects.toThrow('Contraseña incorrecta');expect(await v.hasWebVault()).toBe(true);expect(await v.webVaultFingerprint()).toBe(fingerprint);await v.unlockWebVault('Original-FICTITIOUS-pass');
});
it('cannot migrate or bind a locked/uncreated vault',async()=>{const v=await import('../src/web/vault');await expect(v.changeUnlockedWebPassword('f'.repeat(64))).rejects.toThrow('Desbloquea');await expect(v.writeWebAccountBinding({version:1,userId:'a',emailHash:'fake',fingerprint:'a'.repeat(32)})).rejects.toThrow('Desbloquea');expect(await v.hasWebVault()).toBe(false);});
