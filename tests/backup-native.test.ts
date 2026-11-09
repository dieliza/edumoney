import { pbkdf2Sync } from 'node:crypto';
import { describe,it,expect,vi } from 'vitest';
import { encryptBackup,decryptBackup } from '../src/modules/backup/crypto.native';
const native=vi.hoisted(()=>({deriveKey:vi.fn()}));
vi.mock('expo-modules-core',()=>({requireNativeModule:(name:string)=>{if(name!=='EduMoneyBackupCrypto')throw Error('Módulo inesperado');return native;}}));
describe('Derivación nativa de respaldo',()=>{
 it('usa el puente nativo para ambas operaciones y conserva compatibilidad UTF-8 con el formato portátil',async()=>{native.deriveKey.mockImplementation(async(password:string,salt:string)=>pbkdf2Sync(password,Buffer.from(salt,'hex'),600000,32,'sha256').toString('hex'));const text=await encryptBackup('VECTOR-FICTICIO-UTF8','Prueba-contraseña-😀-2026',async n=>Uint8Array.from({length:n},(_,i)=>i));expect(JSON.parse(text).ciphertext).toBe('4388dad73a70bdd7257f9e0fed8eeab1d55b7c9800e555fb4d170dcd0d68e465fe05e5d2');expect(await decryptBackup(text,'Prueba-contraseña-😀-2026')).toBe('VECTOR-FICTICIO-UTF8');expect(native.deriveKey).toHaveBeenCalledTimes(2);expect(native.deriveKey).toHaveBeenCalledWith('Prueba-contraseña-😀-2026','000102030405060708090a0b0c0d0e0f');});
});
