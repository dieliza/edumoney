import {validateConfig,ORIGIN} from './recovery.mjs';
export const ACCOUNT_ROUTE='/account/access';
const safe=async promise=>{try{const r=await promise;if(r.error)throw Error();return r.data;}catch{throw Error('No se pudo completar. Comprueba los datos o inténtalo más tarde.');}};
const emailOk=x=>typeof x==='string'&&x.length<=254&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x);
export function takeConfirmationToken(location,history){const u=new URL(location.href);history.replaceState(null,'',ACCOUNT_ROUTE);const q=new URLSearchParams(u.hash.slice(1));if(u.origin!==ORIGIN||u.pathname!==ACCOUNT_ROUTE||u.search||[...q.keys()].length!==2||q.get('type')!=='email'||! /^[A-Za-z0-9_-]{20,512}$/.test(q.get('token_hash')||''))throw Error('Enlace de confirmación inválido.');return q.get('token_hash');}
export function accountController(auth,config){
 validateConfig(config);let busy=false,identity=null;
 const run=async fn=>{if(busy)throw Error('Espera a que termine la solicitud.');busy=true;try{return await fn();}finally{busy=false;}};
 return {
  signup:(email,password,repeat,consent)=>run(async()=>{if(!consent)throw Error('Acepta crear una cuenta en línea independiente.');if(!emailOk(email)||password!==repeat||password.length<12||password.length>128)throw Error('Revisa el correo y usa contraseñas iguales de 12 a 128 caracteres.');const data=await safe(auth.signUp({email,password,options:{emailRedirectTo:ORIGIN+ACCOUNT_ROUTE}}));identity=null;if(data?.session){try{await safe(auth.signOut({scope:'local'}));}catch{return 'Solicitud recibida. Revisa tu correo y cierra esta pestaña para descartar la sesión temporal.';}}return 'Revisa tu correo para confirmar la cuenta. Si ya existe, inicia sesión o recupera la contraseña. No se modificó ningún espacio local.';}),
  confirm:token=>run(async()=>{if(! /^[A-Za-z0-9_-]{20,512}$/.test(token||''))throw Error('Enlace inválido.');const data=await safe(auth.verifyOtp({token_hash:token,type:'email'}));identity=null;if(!data?.user?.id)throw Error('Enlace inválido. Solicita una confirmación nueva.');if(data?.session){try{await safe(auth.signOut({scope:'local'}));}catch{return 'Correo confirmado. Cierra esta pestaña para descartar la sesión temporal y vuelve a iniciar sesión.';}}return 'Correo confirmado. Inicia sesión con tu correo y contraseña.';}),
  signin:(email,password)=>run(async()=>{identity=null;if(!emailOk(email)||!password)throw Error('Escribe tu correo y contraseña de cuenta.');await safe(auth.signInWithPassword({email,password}));const d=await safe(auth.getUser());if(!d?.user?.id||!d.user.email_confirmed_at){await safe(auth.signOut({scope:'local'}));throw Error('Confirma primero tu correo.');}identity={id:d.user.id,email:d.user.email};return 'Sesión de cuenta iniciada. Esto no desbloquea ni vincula tu espacio cifrado local.';}),
  signout:()=>run(async()=>{identity=null;await safe(auth.signOut({scope:'local'}));return 'Sesión de cuenta cerrada.';}),
  getVerifiedIdentity:()=>identity?{...identity}:null,
 };
}
// This is a proposal for a later binding review, NOT a persisted association or authorization.
export function bindingProposal({identity,localUnlocked,consent,backupAcknowledged}){if(!identity?.id||!localUnlocked||consent!==true||backupAcknowledged!==true)throw Error('Verifica la cuenta, desbloquea el espacio y confirma la vinculación y el respaldo.');return Object.freeze({accountId:identity.id,status:'requires-server-binding-review',canReadVault:false});}
