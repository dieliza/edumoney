const ORIGIN='https://edumoney-web.diegoluissantospabon.chatgpt.site';
const validId=id=>typeof id==='string'&&/^[a-f0-9]{8}-[a-f0-9-]{27}$/.test(id);
export async function handleAdmin(request,env,fetcher=fetch){
 const cors={'Access-Control-Allow-Origin':ORIGIN,'Access-Control-Allow-Headers':'authorization,apikey,content-type,x-client-info','Access-Control-Allow-Methods':'POST,OPTIONS',Vary:'Origin','Cache-Control':'no-store','Content-Type':'application/json'};
 const reply=(status,data)=>new Response(status===204?null:JSON.stringify(data),{status,headers:cors});
 if(request.headers.get('Origin')!==ORIGIN)return reply(403,{error:'Origen no permitido.'});if(request.method==='OPTIONS')return reply(204,null);if(request.method!=='POST')return reply(405,{error:'Método no permitido.'});
 const token=request.headers.get('Authorization')??'';if(!/^Bearer [A-Za-z0-9._-]{20,8192}$/.test(token))return reply(401,{error:'Inicia sesión con tu cuenta administradora.'});
 const url=env.SUPABASE_URL,secret=env.SUPABASE_SERVICE_ROLE_KEY;if(!url||!secret||!url.startsWith('https://kvjrxcvxwoezajarvtgb.supabase.co'))return reply(503,{error:'Administración no configurada.'});
 const adminHeaders={apikey:secret,Authorization:'Bearer '+secret,'Content-Type':'application/json'};
 async function api(path,options={}){const r=await fetcher(url+path,{...options,headers:{...adminHeaders,...options.headers},signal:AbortSignal.timeout(20000)});let data=null;if(r.status!==204){try{data=await r.json();}catch{}}return{ok:r.ok,status:r.status,data};}
 async function state(uid){const r=await api('/rest/v1/edumoney_account_access?user_id=eq.'+uid+'&select=status');if(!r.ok)throw Error('state');return r.data?.[0]?.status??'active';}
 async function setState(uid,status,actor){const r=await api('/rest/v1/edumoney_account_access',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify({user_id:uid,status,updated_at:new Date().toISOString(),updated_by:actor})});if(!r.ok)throw Error('write');}
 try{
  const verified=await fetcher(url+'/auth/v1/user',{headers:{apikey:env.SUPABASE_ANON_KEY??secret,Authorization:token},signal:AbortSignal.timeout(15000)});if(!verified.ok)return reply(401,{error:'La sesión no es válida.'});const raw=await verified.json(),user=raw.user??raw;if(!validId(user.id))return reply(401,{error:'La sesión no es válida.'});
  const fresh=await api('/auth/v1/admin/users/'+user.id);const actor=fresh.data?.user??fresh.data;
  if(!fresh.ok||actor?.id!==user.id||actor.app_metadata?.edumoney_admin!==true||!actor.email_confirmed_at||actor.deleted_at||(actor.banned_until&&new Date(actor.banned_until)>new Date())||await state(user.id)!=='active')return reply(403,{error:'Acceso reservado a la cuenta administradora.'});
  const text=await request.text();if(text.length>4096)return reply(413,{error:'Solicitud demasiado grande.'});let body;try{body=JSON.parse(text);}catch{return reply(400,{error:'Solicitud no válida.'});}
  if(body.action==='list'){
   const page=Number(body.page??1);if(!Number.isInteger(page)||page<1||page>100000)return reply(400,{error:'Página no válida.'});
   const [list,totals,states]=await Promise.all([api('/auth/v1/admin/users?page='+page+'&per_page=40'),api('/rest/v1/rpc/edumoney_admin_user_totals',{method:'POST',body:JSON.stringify({actor_id:user.id})}),api('/rest/v1/edumoney_account_access?select=user_id,status')]);
   if(!list.ok||!totals.ok||!states.ok)throw Error('list');const map=new Map((states.data??[]).map(r=>[r.user_id,r.status]));const all=list.data?.users??[];
   const users=all.filter(u=>!u.deleted_at&&map.get(u.id)!=='deleted').map(u=>({id:u.id,email:u.email??'',confirmed:!!u.email_confirmed_at,createdAt:u.created_at,lastSignInAt:u.last_sign_in_at,isAdmin:u.app_metadata?.edumoney_admin===true,status:map.get(u.id)==='suspended'||(u.banned_until&&new Date(u.banned_until)>new Date())?'suspended':'active'}));
   return reply(200,{users,counts:totals.data,page,hasMore:all.length===40});
  }
  if(!['reset','verify','suspend','reactivate','delete'].includes(body.action)||!validId(body.userId))return reply(400,{error:'Acción no válida.'});
  const targetResult=await api('/auth/v1/admin/users/'+body.userId);const target=targetResult.data?.user??targetResult.data;if(!targetResult.ok||!target?.id||target.deleted_at||await state(target.id)==='deleted')return reply(404,{error:'La cuenta no existe o ya fue eliminada.'});
  if(body.action==='reset'||body.action==='verify'){
   const path=body.action==='reset'?'/auth/v1/recover?redirect_to='+encodeURIComponent(ORIGIN+'/account/recovery'):'/auth/v1/resend';
   const r=await api(path,{method:'POST',body:JSON.stringify(body.action==='reset'?{email:target.email}:{type:'signup',email:target.email,options:{emailRedirectTo:ORIGIN+'/account/access'}})});
   return r.ok?reply(200,{message:'Solicitud de correo aceptada. La entrega depende del proveedor de correo.'}):reply(r.status===429?429:503,{error:'El proveedor no aceptó el envío. Inténtalo más tarde.'});
  }
  if(target.id===user.id||target.app_metadata?.edumoney_admin===true)return reply(409,{error:'No puedes suspender ni eliminar una cuenta administradora desde este panel.'});
  if(body.action==='reactivate'){
   const r=await api('/auth/v1/admin/users/'+target.id,{method:'PUT',body:JSON.stringify({ban_duration:'none'})});if(!r.ok)throw Error('reactivate');await setState(target.id,'active',user.id);return reply(200,{message:'Cuenta reactivada.'});
  }
  if(body.action==='delete'&&String(body.confirmEmail??'').trim().toLowerCase()!==String(target.email??'').toLowerCase())return reply(400,{error:'Escribe el correo exacto para confirmar la eliminación.'});
  await setState(target.id,'suspended',user.id);
  const revoke=await api('/rest/v1/rpc/edumoney_admin_revoke_sessions',{method:'POST',body:JSON.stringify({actor_id:user.id,target_id:target.id})});if(!revoke.ok)throw Error('revoke');
  const result=await api('/auth/v1/admin/users/'+target.id,{method:body.action==='delete'?'DELETE':'PUT',body:JSON.stringify(body.action==='delete'?{should_soft_delete:true}:{ban_duration:'876000h'})});if(!result.ok)return reply(503,{error:'El acceso quedó deshabilitado, pero falta completar la operación en Auth. Vuelve a intentarlo.'});
  if(body.action==='delete')await setState(target.id,'deleted',user.id);
  return reply(200,{message:body.action==='delete'?'Cuenta eliminada. Las copias locales no se borraron.':'Cuenta suspendida y sesiones revocadas.'});
 }catch{return reply(503,{error:'No se pudo completar la administración. Vuelve a intentarlo.'});}
}
