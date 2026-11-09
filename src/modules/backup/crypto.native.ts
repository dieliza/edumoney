import { requireNativeModule } from 'expo-modules-core';
import { bytesToHex,hexToBytes } from '@noble/hashes/utils.js';
import { encryptBackup as encryptCore,decryptBackup as decryptCore,type BackupDerivation } from './cryptoCore';
export { BACKUP_KDF_ITERATIONS,MAX_BACKUP_CHARS,validatePassword } from './cryptoCore';
const native=requireNativeModule<{deriveKey(password:string,salt:string):Promise<string>}>('EduMoneyBackupCrypto');
const derive:BackupDerivation=async(password,salt)=>{const hex=await native.deriveKey(password,bytesToHex(salt));if(!/^[a-f0-9]{64}$/.test(hex))throw Error('Derivación nativa no válida');return hexToBytes(hex);};
export function encryptBackup(plaintext:string,password:string,random:(n:number)=>Promise<Uint8Array>){return encryptCore(plaintext,password,random,derive);}
export function decryptBackup(text:string,password:string){return decryptCore(text,password,derive);}
