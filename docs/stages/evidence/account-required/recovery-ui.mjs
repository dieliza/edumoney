import config from './config.mjs';
import {ORIGIN,ROUTE,takeRecoveryToken,validateConfig,isolatedClient,recoveryController} from './recovery.mjs';
const status=document.querySelector('#status'),verify=document.querySelector('#verify'),form=document.querySelector('#passwords'),request=document.querySelector('#request');
let token,flow;
async function action(fn){for(const b of document.querySelectorAll('button'))b.disabled=true;try{status.textContent=await fn();}catch(e){status.textContent=e.message;}finally{for(const b of document.querySelectorAll('button'))b.disabled=false;}}
try{
 if(location.hash||location.search)token=takeRecoveryToken(location,history);
 else if(location.origin!==ORIGIN||location.pathname!==ROUTE)throw Error();
 validateConfig(config);
 const {createClient}=await import('./supabase-sdk.mjs');
 flow=recoveryController(isolatedClient(createClient,config).auth,config);
 if(token){status.textContent='Continúa para elegir la nueva contraseña de tu cuenta.';verify.hidden=false;}
 else{status.textContent='Escribe el correo de tu cuenta en línea. Si solo utilizas una contraseña local, este correo no recuperará tu espacio cifrado.';request.hidden=false;}
 request.onsubmit=e=>{e.preventDefault();action(async()=>{const message=await flow.request(request.querySelector('#email').value.trim());request.reset();request.hidden=true;return message;});};
 verify.onclick=()=>action(async()=>{const t=token;token=null;verify.hidden=true;let message;try{message=await flow.verify(t);}catch(error){request.hidden=false;throw error;}form.hidden=false;return message;});
 form.onsubmit=e=>{e.preventDefault();action(async()=>{try{const message=await flow.update(form.querySelector('#password').value,form.querySelector('#repeat').value);form.hidden=true;return message;}finally{form.reset();}});};
}catch{token=null;status.textContent='La recuperación de cuenta no está disponible o el enlace no es válido. El acceso a tu espacio local permanece sin cambios.';}
