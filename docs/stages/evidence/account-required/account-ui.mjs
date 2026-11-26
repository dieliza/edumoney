import config from './config.mjs';
import {ORIGIN,validateConfig,isolatedClient} from './recovery.mjs';
import {ACCOUNT_ROUTE,takeConfirmationToken,accountController} from './account.mjs';
const status=document.querySelector('#status'),signin=document.querySelector('#signin'),signup=document.querySelector('#signup'),confirm=document.querySelector('#confirm'),signout=document.querySelector('#signout');let token,controller;
const value=(form,name)=>form.querySelector(`[name="${name}"]`).value;
async function action(fn){for(const b of document.querySelectorAll('button'))b.disabled=true;try{status.textContent=await fn();}catch(e){status.textContent=e.message;}finally{for(const b of document.querySelectorAll('button'))b.disabled=false;for(const input of document.querySelectorAll('input[type="password"]'))input.value='';}}
try{
 if(location.hash||location.search)token=takeConfirmationToken(location,history);else if(location.origin!==ORIGIN||location.pathname!==ACCOUNT_ROUTE)throw Error();validateConfig(config);
 const {createClient}=await import('./supabase-sdk.mjs');controller=accountController(isolatedClient(createClient,config).auth,config);
 if(token){confirm.hidden=false;status.textContent='Pulsa Confirmar mi correo para continuar.';}else{signin.hidden=false;signup.hidden=false;status.textContent='Crea tu cuenta o inicia sesión. Tu espacio local permanece independiente.';}
 confirm.onclick=()=>action(async()=>{const t=token;token=null;confirm.hidden=true;const msg=await controller.confirm(t);signin.hidden=false;return msg;});
 signup.onsubmit=e=>{e.preventDefault();action(async()=>{const msg=await controller.signup(value(signup,'email').trim(),value(signup,'password'),value(signup,'repeat'),signup.querySelector('[name="consent"]').checked);signup.reset();return msg;});};
 signin.onsubmit=e=>{e.preventDefault();action(async()=>{const msg=await controller.signin(value(signin,'email').trim(),value(signin,'password'));signin.hidden=true;signup.hidden=true;signout.hidden=false;return msg;});};
 signout.onclick=()=>action(async()=>{const msg=await controller.signout();signout.hidden=true;signin.hidden=false;signup.hidden=false;return msg;});
}catch{token=null;status.textContent='El acceso de cuenta aún no está habilitado o el enlace no es válido. Puedes usar tu espacio local como antes.';}
