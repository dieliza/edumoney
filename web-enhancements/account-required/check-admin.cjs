const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const owner='729ce60f-a1a9-485b-8aaf-229c66c9da19',other='11111111-1111-4111-8111-111111111111',origin='https://edumoney-web.diegoluissantospabon.chatgpt.site';
let role=true,targetAdmin=false,state='active',calls=[];
const env={SUPABASE_URL:'https://kvjrxcvxwoezajarvtgb.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'fixture-only'};
const response=data=>new Response(JSON.stringify(data));
async function fetcher(url,opt={}){calls.push({url,opt});const p=new URL(url).pathname;
 if(p==='/auth/v1/user')return response({id:owner,user_metadata:{edumoney_admin:true}});
 if(p==='/auth/v1/admin/users/'+owner)return response({id:owner,email_confirmed_at:'2026',app_metadata:{edumoney_admin:role}});
 if(p==='/auth/v1/admin/users/'+other)return response(opt.method?{}:{id:other,email:'fixture@example.test',email_confirmed_at:'2026',app_metadata:{edumoney_admin:targetAdmin},encrypted_password:'never-return-this'});
 if(p==='/auth/v1/admin/users')return response({users:[{id:other,email:'fixture@example.test',app_metadata:{},encrypted_password:'never-return-this'}]});
 if(p.endsWith('edumoney_admin_user_totals'))return response({total:1,active:1,pending:0,suspended:0});
 if(p.endsWith('edumoney_admin_revoke_sessions'))return response(1);
 if(p.endsWith('edumoney_account_access'))return response(opt.method?{}:new URL(url).searchParams.has('user_id')?[{status:state}]:[]);
 return response({});}
const ctx=vm.createContext({Response,URL,Date,Map,AbortSignal,fetch:fetcher});vm.runInContext(fs.readFileSync('supabase/functions/edumoney-admin-users/handler.js','utf8').replace('export async function','async function')+';globalThis.handle=handleAdmin;',ctx);
function req(body,token=true){return new Request(origin+'/admin',{method:'POST',headers:{Origin:origin,...token?{Authorization:'Bearer '+('x'.repeat(30))}:{},'Content-Type':'application/json'},body:JSON.stringify(body)});}
async function main(){
 assert.equal((await ctx.handle(req({},false),env,fetcher)).status,401);console.log('PASS 1 missing token');
 role=false;calls=[];assert.equal((await ctx.handle(req({action:'delete',userId:other}),env,fetcher)).status,403);assert(!calls.some(c=>c.opt.method));console.log('PASS 2 fresh trusted role required despite user metadata');role=true;
 state='suspended';assert.equal((await ctx.handle(req({action:'list'}),env,fetcher)).status,403);state='active';console.log('PASS 3 suspended admin denied');
 targetAdmin=true;assert.equal((await ctx.handle(req({action:'suspend',userId:other}),env,fetcher)).status,409);targetAdmin=false;assert.equal((await ctx.handle(req({action:'delete',userId:owner}),env,fetcher)).status,409);console.log('PASS 4 self and admin protected');
 calls=[];assert.equal((await ctx.handle(req({action:'delete',userId:other,confirmEmail:'wrong'}),env,fetcher)).status,400);assert(!calls.some(c=>c.opt.method));console.log('PASS 5 delete confirmation before mutations');
 calls=[];assert.equal((await ctx.handle(req({action:'delete',userId:other,confirmEmail:'fixture@example.test'}),env,fetcher)).status,200);const writes=calls.filter(c=>c.opt.method);assert.deepEqual(writes.map(c=>c.opt.method),['POST','POST','DELETE','POST']);assert.equal(JSON.parse(writes[0].opt.body).status,'suspended');assert.equal(JSON.parse(writes[3].opt.body).status,'deleted');console.log('PASS 6 block then revoke then delete then tombstone');
 calls=[];assert.equal((await ctx.handle(req({action:'reactivate',userId:other}),env,fetcher)).status,200);assert.deepEqual(calls.filter(c=>c.opt.method).map(c=>c.opt.method),['PUT','POST']);console.log('PASS 7 reactivate Auth before access');
 const list=await ctx.handle(req({action:'list'}),env,fetcher);const data=await list.json();assert.equal(data.counts.total,1);assert.equal(data.users[0].email,'fixture@example.test');assert(!JSON.stringify(data).includes('encrypted_password'));assert(!JSON.stringify(data).includes('fixture-only'));console.log('PASS 8 minimal list without credential secrets');
 assert.equal((await ctx.handle(new Request(origin,{method:'OPTIONS',headers:{Origin:origin}}),env,fetcher)).status,204);console.log('PASS 9 CORS preflight');
 fs.writeFileSync('docs/stages/evidence/account-required/admin-checks.json',JSON.stringify({cases:9,passed:true,scope:'Real Edge handler with simulated Auth, database, mail boundaries; no real user mutation or mail'},null,2));
}main().catch(e=>{console.error(e);process.exitCode=1;});
