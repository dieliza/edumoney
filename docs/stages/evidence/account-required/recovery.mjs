export const ORIGIN='https://edumoney-web.diegoluissantospabon.chatgpt.site';
export const ROUTE='/account/recovery';
export const WARNING='Esto cambia únicamente la contraseña de tu cuenta en línea. No recupera ni cambia la contraseña de tu espacio cifrado local. Tus registros existentes no se borrarán.';
const excluded=new Set(['zfsyusxzajwnnbuthezh','stuxdzdhjwnufxzgwaok']);
export function validateConfig(c){
 if(c?.enabled!==true||c?.dedicatedTenantVerified!==true||c.projectRef!=='kvjrxcvxwoezajarvtgb'||excluded.has(c.projectRef)||c.url!==`https://${c.projectRef}.supabase.co`||!/^sb_publishable_[A-Za-z0-9_-]+$/.test(c.publishableKey||''))throw Error('La recuperación de cuenta aún no está habilitada.');
 return c;
}
// Caller must provide a pinned, locally bundled official Supabase SDK, not a CDN script.
export function isolatedClient(createClient,c){validateConfig(c);return createClient(c.url,c.publishableKey,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false,storageKey:'edumoney-recovery-memory-only'}});}
export function takeRecoveryToken(location,history){
 const url=new URL(location.href);
 // Clear all untrusted URL state BEFORE SDK init, logging, UI, or another request.
 history.replaceState(null,'',ROUTE);
 if(url.origin!==ORIGIN||url.pathname!==ROUTE||url.search)throw Error('Enlace de recuperación inválido. Solicita uno nuevo.');
 const q=new URLSearchParams(url.hash.slice(1));const keys=[...q.keys()];
 if(keys.length!==2||q.get('type')!=='recovery'||keys.filter(x=>x==='token_hash').length!==1||! /^[A-Za-z0-9_-]{20,512}$/.test(q.get('token_hash')||''))throw Error('Enlace de recuperación inválido. Solicita uno nuevo.');
 return q.get('token_hash');
}
const checked=async p=>{try{const r=await p;if(r.error)throw Error();return r.data;}catch{throw Error('No se pudo completar la solicitud. Revisa el enlace o inténtalo más tarde.');}};
export function recoveryController(auth,c){
 validateConfig(c);let verified=false,busy=false,finished=false;
 const run=async fn=>{if(busy)throw Error('Espera a que termine la solicitud.');busy=true;try{return await fn();}finally{busy=false;}};
 return {
  request:email=>run(async()=>{if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254)throw Error('Escribe un correo válido.');await checked(auth.resetPasswordForEmail(email,{redirectTo:ORIGIN+ROUTE}));return 'Si existe una cuenta con ese correo, recibirás un enlace para elegir una contraseña nueva.';}),
  verify:token=>run(async()=>{if(finished||verified||! /^[A-Za-z0-9_-]{20,512}$/.test(token||''))throw Error('Solicita un enlace nuevo.');const d=await checked(auth.verifyOtp({token_hash:token,type:'recovery'}));if(!d?.session||!d?.user?.id)throw Error('Enlace vencido o inválido. Solicita uno nuevo.');verified=true;return 'Enlace verificado. Elige tu nueva contraseña de cuenta.';}),
  update:(password,repeat)=>run(async()=>{if(!verified||finished)throw Error('Verifica primero el enlace.');if(password!==repeat||password.length<12||password.length>128)throw Error('Las contraseñas deben coincidir y tener entre 12 y 128 caracteres.');await checked(auth.updateUser({password}));finished=true;verified=false;try{await checked(auth.signOut({scope:'local'}));}catch{return 'Contraseña actualizada. Cierra esta pestaña para descartar la sesión temporal.';}return 'Contraseña de cuenta actualizada. Puedes cerrar esta pestaña. Tu espacio local no cambió.';}),
  close:()=>run(async()=>{verified=false;finished=true;await checked(auth.signOut({scope:'local'}));}),
 };
}
// No automatic link by email, no vault mutation, no account creation while locked.
export function accountOptInAvailable(c,isLocalUnlocked){try{validateConfig(c);return isLocalUnlocked()===true;}catch{return false;}}
export async function createAccountOptIn(auth,c,isLocalUnlocked,{email,password,consent}){
 if(!accountOptInAvailable(c,isLocalUnlocked)||consent!==true)throw Error('Desbloquea tu espacio y acepta crear una cuenta independiente.');
 if(password.length<12||password.length>128||! /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw Error('Revisa correo y contraseña.');
 await checked(auth.signUp({email,password}));
 return 'Revisa tu correo para confirmar la cuenta. Tu espacio local no se ha vinculado ni modificado.';
}
