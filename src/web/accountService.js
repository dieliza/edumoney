import * as vault from './vault';
import {hasBiometric,unlockBiometric} from './biometrics';
let clientPromise,identity=null,localOnly=false;
const ORIGIN='https://edumoney-web.diegoluissantospabon.chatgpt.site';
const safeEmail=email=>email.trim().toLowerCase();
const validEmail=email=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)&&email.length<=254;
const base64=raw=>btoa(String.fromCharCode(...new Uint8Array(raw)));
const bytes=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
async function client(){
 if(!clientPromise)clientPromise=(async()=>{const configPath='/account/config.mjs',sdkPath='/account/supabase-sdk.mjs';const {default:c}=await import(configPath);if(c.enabled!==true||c.projectRef!=='kvjrxcvxwoezajarvtgb'||c.url!=='https://kvjrxcvxwoezajarvtgb.supabase.co')throw Error('El acceso de cuentas todavía no está disponible. Conserva tus datos.');const {createClient}=await import(sdkPath);return createClient(c.url,c.publishableKey,{auth:{persistSession:false,autoRefreshToken:true,detectSessionInUrl:false,storageKey:'edumoney-required-account-memory'}});})();return clientPromise;
}
async function checked(promise){const result=await promise;if(result.error)throw Error('No se pudo completar. Revisa el correo, la contraseña y la conexión.');return result.data;}
async function verified(token){const data=await checked((await client()).auth.getUser(token));if(!data?.user?.id||!data.user.email_confirmed_at)throw Error('Confirma primero tu correo electrónico.');return data.user;}
async function emailHash(email){const value=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(safeEmail(email)));return Array.from(new Uint8Array(value),n=>n.toString(16).padStart(2,'0')).join('');}
async function workspaceKey(){
 const data=await checked((await client()).auth.getSession());if(!data?.session?.access_token)throw Error('Inicia sesión con tu correo verificado.');
 const user=await verified(data.session.access_token),binding=await vault.readWebAccountBinding();if(binding&&binding.userId!==user.id)throw Error('Estos registros están vinculados a otra cuenta.');
 const result=await fetch('/api/email-workspace',{method:'POST',headers:{Authorization:'Bearer '+data.session.access_token},cache:'no-store'});
 if(!result.ok)throw Error('No pudimos abrir la protección de tu cuenta. Conserva tus datos e inténtalo más tarde.');const key=await result.text();if(!/^[a-f0-9]{64}$/.test(key))throw Error('La respuesta de protección no es válida.');return {user,key};
}
async function wrappingKey(password,salt){const material=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveKey']);return crypto.subtle.deriveKey({name:'PBKDF2',hash:'SHA-256',salt,iterations:600000},material,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);}
async function enroll(user,key,password){
 await vault.verifyWebPassword(key);const fingerprint=await vault.webVaultFingerprint(),salt=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12));
 const aad=new TextEncoder().encode(`edumoney-offline-account-v1:${user.id}:${fingerprint}`),cipher=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:aad},await wrappingKey(password,salt),new TextEncoder().encode(key));
 await vault.writeWebAccountBinding({version:1,userId:user.id,emailHash:await emailHash(user.email),fingerprint,offline:{salt:base64(salt),iv:base64(iv),ciphertext:base64(cipher)}});
 try{localStorage.setItem('edu-email-owner',user.id);sessionStorage.removeItem('edu-email-once');}catch{/* Binding in IndexedDB remains authoritative for this client. */}
 identity={id:user.id,email:user.email,admin:user.app_metadata?.edumoney_admin===true};localOnly=false;
}
async function ensureOwner(user){const binding=await vault.readWebAccountBinding();if(binding&&binding.userId!==user.id)throw Error('Este navegador contiene registros vinculados a otra cuenta. No se cambiaron los datos.');
 let previous;try{previous=localStorage.getItem('edu-email-owner');}catch{}if(previous&&previous!==user.id)throw Error('Este navegador ya tiene registros de otra cuenta. No se cambiaron los datos.');return binding;}
async function signupAccountFlow(email,password,repeat){email=safeEmail(email);if(!validEmail(email)||password.length<12||password.length>128||password!==repeat)throw Error('Escribe un correo válido y la misma contraseña dos veces, de 12 a 128 caracteres.');await checked((await client()).auth.signUp({email,password,options:{emailRedirectTo:ORIGIN+'/'}}));await (await client()).auth.signOut({scope:'local'});identity=null;return 'Revisa tu correo para confirmar tu cuenta. Después inicia sesión con ese correo y contraseña.';}
async function signinAccountFlow(email,password){
 email=safeEmail(email);if(!validEmail(email)||!password)throw Error('Escribe tu correo y contraseña.');const binding=await vault.readWebAccountBinding();
 if(typeof navigator!=='undefined'&&navigator.onLine===false&&binding?.offline){
  if(binding.emailHash!==await emailHash(email)||binding.fingerprint!==await vault.webVaultFingerprint())throw Error('Conéctate para verificar esta cuenta.');
  const aad=new TextEncoder().encode(`edumoney-offline-account-v1:${binding.userId}:${binding.fingerprint}`);let plain;try{plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:bytes(binding.offline.iv),additionalData:aad},await wrappingKey(password,bytes(binding.offline.salt)),bytes(binding.offline.ciphertext));}catch{throw Error('No pudimos abrir el acceso sin conexión. Revisa la contraseña o conéctate para recuperar la cuenta.');}
  await vault.unlockWebVault(new TextDecoder().decode(plain));identity={id:binding.userId,email};localOnly=true;return {ready:true,localOnly:true};
 }
 await checked((await client()).auth.signInWithPassword({email,password}));const user=await verified();await ensureOwner(user);const scoped=await workspaceKey();if(scoped.user.id!==user.id)throw Error('La sesión cambió. Vuelve a iniciar sesión.');const key=scoped.key;
 if(!await vault.hasWebVault()){await vault.unlockWebVault(key);await enroll(user,key,password);return {ready:true};}
 if(vault.isWebVaultUnlocked()){
  try{await vault.verifyWebPassword(key);}catch{await vault.changeUnlockedWebPassword(key);}await enroll(user,key,password);return {ready:true};
 }
 try{await vault.unlockWebVault(key);}catch(error){
  if(!(error instanceof Error)||!error.message.startsWith('Contraseña incorrecta'))throw error;
  try{await vault.unlockWebVault(password);}catch(legacyError){if(legacyError instanceof Error&&legacyError.message.startsWith('Contraseña incorrecta'))return {ready:false,needsLegacy:true};throw legacyError;}
  await vault.changeUnlockedWebPassword(key);
 }
 await enroll(user,key,password);return {ready:true};
}
async function linkLegacyAccountFlow(previous,password){const {user,key}=await workspaceKey();await ensureOwner(user);if(!vault.isWebVaultUnlocked())await vault.unlockWebVault(previous);await vault.changeUnlockedWebPassword(key);await enroll(user,key,password);return {ready:true};}
async function linkLegacyWithBiometricFlow(password){const {user,key}=await workspaceKey();await ensureOwner(user);if(!vault.isWebVaultUnlocked())await unlockBiometric();await vault.changeUnlockedWebPassword(key);await enroll(user,key,password);return {ready:true};}
async function requestAccountRecoveryFlow(email){email=safeEmail(email);if(!validEmail(email))throw Error('Escribe el correo de tu cuenta.');await checked((await client()).auth.resetPasswordForEmail(email,{redirectTo:ORIGIN+'/'}));return 'Si existe una cuenta con ese correo, recibirás un enlace para crear una contraseña nueva.';}
export async function biometricAccountAvailable(){const binding=await vault.readWebAccountBinding();return !!binding&&binding.fingerprint===await vault.webVaultFingerprint()&&await hasBiometric();}
export async function legacyBiometricAvailable(){return hasBiometric();}
async function signinAccountWithBiometricFlow(){const binding=await vault.readWebAccountBinding();if(!binding||binding.fingerprint!==await vault.webVaultFingerprint())throw Error('Primero vincula tu correo entrando con tu contraseña.');await unlockBiometric();identity={id:binding.userId,email:''};localOnly=true;return {ready:true,localOnly:true};}
async function confirmedWorkspaceKeyFlow(password){
 const binding=await vault.readWebAccountBinding();if(!binding)return password;const email=identity?.email;if(!email)throw Error('Vuelve a entrar con tu correo y contraseña antes de cambiar la seguridad.');
 await checked((await client()).auth.signInWithPassword({email,password}));const {user,key}=await workspaceKey();if(user.id!==binding.userId)throw Error('La cuenta no corresponde a estos registros.');await vault.verifyWebPassword(key);return key;
}
async function changeAccountPasswordFlow(current,password,repeat){
 if(password!==repeat||password.length<12||password.length>128)throw Error('Las contraseñas deben coincidir y tener entre 12 y 128 caracteres.');const key=await confirmedWorkspaceKeyFlow(current),binding=await vault.readWebAccountBinding();if(!binding)throw Error('Vincula primero tu correo para activar la recuperación.');
 const user=await verified();await checked((await client()).auth.updateUser({password}));try{await enroll(user,key,password);}catch{throw Error('La contraseña de cuenta cambió. Conéctate e inicia sesión con la nueva para completar el acceso sin conexión; tus registros se conservan.');}localOnly=false;
}
export function accountIdentity(){return identity?{...identity,localOnly}:null;}
async function requestEmailAccountLinkFlow(email){email=safeEmail(email);if(!validEmail(email))throw Error('Escribe el correo de tu cuenta.');const entryPath='/account/email-entry.mjs';const entry=await import(entryPath);await entry.send(email);return 'Revisa tu correo y abre el enlace en este mismo navegador.';}
async function consumeEmailAccountEntryFlow(){
 let raw;try{raw=sessionStorage.getItem('edu-email-once');sessionStorage.removeItem('edu-email-once');}catch{return false;}if(!raw||raw.length>4096)return false;
 let entry;try{entry=JSON.parse(raw);}catch{return false;}const binding=await vault.readWebAccountBinding();
 if(!binding||entry.id!==binding.userId||!Number.isFinite(entry.until)||entry.until<Date.now()||entry.until>Date.now()+600000||!/^[a-f0-9]{64}$/.test(entry.key??'')||binding.fingerprint!==await vault.webVaultFingerprint())return false;
 await vault.unlockWebVault(entry.key);identity={id:binding.userId,email:''};localOnly=true;return true;
}

let accountOperation=false;
async function exclusiveAccount(task){if(accountOperation)throw Error('Espera a que termine la solicitud de cuenta.');accountOperation=true;try{return await task();}finally{accountOperation=false;}}
export function signupAccount(...args){return exclusiveAccount(()=>signupAccountFlow(...args));}
export function signinAccount(...args){return exclusiveAccount(()=>signinAccountFlow(...args));}
export function linkLegacyAccount(...args){return exclusiveAccount(()=>linkLegacyAccountFlow(...args));}
export function linkLegacyWithBiometric(...args){return exclusiveAccount(()=>linkLegacyWithBiometricFlow(...args));}
export function requestAccountRecovery(...args){return exclusiveAccount(()=>requestAccountRecoveryFlow(...args));}
export function signinAccountWithBiometric(...args){return exclusiveAccount(()=>signinAccountWithBiometricFlow(...args));}
export function confirmedWorkspaceKey(...args){return exclusiveAccount(()=>confirmedWorkspaceKeyFlow(...args));}
export function changeAccountPassword(...args){return exclusiveAccount(()=>changeAccountPasswordFlow(...args));}
export function requestEmailAccountLink(...args){return exclusiveAccount(()=>requestEmailAccountLinkFlow(...args));}
export function consumeEmailAccountEntry(...args){return exclusiveAccount(()=>consumeEmailAccountEntryFlow(...args));}
export async function accountEnrollmentKnown(){return !!await vault.readWebAccountBinding();}

export function adminAction(action,payload={}){return exclusiveAccount(async()=>{
 const session=await checked((await client()).auth.getSession());if(!session?.session?.access_token)throw Error('Vuelve a entrar con tu correo y contraseña para administrar.');
 const user=await verified(session.session.access_token);if(user.app_metadata?.edumoney_admin!==true)throw Error('Acceso reservado a la cuenta administradora.');
 const result=await fetch('https://kvjrxcvxwoezajarvtgb.supabase.co/functions/v1/edumoney-admin-users',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+session.session.access_token},body:JSON.stringify({...payload,action}),cache:'no-store'});
 let data;try{data=await result.json();}catch{throw Error('No pudimos cargar la administración.');}if(!result.ok)throw Error(data.error??'No se pudo completar la administración.');return data;
});}

let accountLinkPromise,recoveryVerified=false;
export function beginAccountLink(){
 if(accountLinkPromise)return accountLinkPromise;
 let hash='';if(typeof location!=='undefined'){hash=location.hash;if(hash)history.replaceState(null,'',location.pathname+location.search);}
 accountLinkPromise=exclusiveAccount(async()=>{
  if(!hash)return null;const q=new URLSearchParams(hash.slice(1));const type=q.get('type'),token=q.get('token_hash');
  if([...q.keys()].length!==2||!['email','signup','recovery'].includes(type)||!/^[A-Za-z0-9_-]{20,512}$/.test(token??''))throw Error('Este enlace no es válido. Solicita uno nuevo desde «Olvidé mi contraseña».');
  const data=await checked((await client()).auth.verifyOtp({token_hash:token,type}));if(!data?.user?.id||!data.user.email_confirmed_at)throw Error('El enlace venció. Solicita uno nuevo.');
  recoveryVerified=type==='recovery';return{recovery:recoveryVerified,email:data.user.email??''};
 });return accountLinkPromise;
}
export function finishAccountRecovery(password,repeat){return exclusiveAccount(async()=>{
 if(!recoveryVerified)throw Error('Abre el enlace de recuperación que recibiste.');
 if(password!==repeat||password.length<12||password.length>128)throw Error('Las contraseñas deben coincidir y tener entre 12 y 128 caracteres.');
 const user=await verified();await checked((await client()).auth.updateUser({password}));recoveryVerified=false;
 return signinAccountFlow(user.email,password);
});}
