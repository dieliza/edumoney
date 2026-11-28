import {educationOwner} from './owner-security.mjs';
const codes=new Set('PR AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY'.split(' '));
const prefix='tax-rules/v1/';
const researchMonth=new Intl.DateTimeFormat('en-US',{timeZone:'America/Puerto_Rico',year:'numeric',month:'2-digit'});
export function monthlyReviewDue(checkedAt,now=Date.now()){const previous=Date.parse(checkedAt);return !Number.isFinite(previous)||researchMonth.format(new Date(previous))!==researchMonth.format(new Date(now));}
const json=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const valid=(code,year)=>codes.has(code)&&Number.isInteger(year)&&year>=1900&&year<=9999;
const hash=async text=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text))),v=>v.toString(16).padStart(2,'0')).join('');
export function official(url){try{const u=new URL(url);return u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&u.hostname.endsWith('.gov');}catch{return false;}}
export async function source(url,fetcher=fetch){
 for(let redirects=0;redirects<5;redirects++){
  if(!official(url))throw Error('non_official_source');
  const r=await fetcher(url,{redirect:'manual',signal:AbortSignal.timeout(12000),headers:{Accept:'text/html,text/plain,application/pdf'}});
  if(r.status>=300&&r.status<400){url=new URL(r.headers.get('location'),url).href;continue;}
  if(!r.ok)throw Error('source_unavailable');
  if(Number(r.headers.get('content-length')??0)>1500000)throw Error('source_too_large');
  const reader=r.body.getReader(),chunks=[];let length=0;for(;;){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>1500000){await reader.cancel();throw Error('source_too_large');}chunks.push(value);}
  const bytes=new Uint8Array(length);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length;}
  const raw=new TextDecoder().decode(bytes);if(r.headers.get('content-type')?.includes('pdf'))throw Error('pdf_requires_review');
  const text=raw.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&nbsp;|&#160;/g,' ').replace(/\s+/g,' ').trim();
  if(text.length<100)throw Error('source_empty');const links=[...raw.matchAll(/href=["']([^"']+)["']/gi)].map(m=>{try{return new URL(m[1],url).href;}catch{return '';}}).filter(u=>official(u)&&/tax|revenue|withhold|deduct|credit|retire|ira|forms|exempt/i.test(u));return{url,text,links:[...new Set(links)].slice(0,30),sha256:await hash(text),retrievedAt:new Date().toISOString()};
 }throw Error('redirect_limit');
}
async function load(env,key){const o=await env.BUCKET.get(prefix+key);return o?{value:await o.json(),etag:o.etag}:{value:null,etag:null};}
async function save(env,key,value,etag){return !!await env.BUCKET.put(prefix+key,JSON.stringify(value),{httpMetadata:{contentType:'application/json'},onlyIf:etag?{etagMatches:etag}:{etagDoesNotMatch:'*'}});}
function seeds(code){return code==='PR'?['https://hacienda.pr.gov/individuos','https://hacienda.pr.gov/publicaciones']:['https://www.irs.gov/retirement-plans/traditional-and-roth-iras','https://www.irs.gov/retirement-plans/ira-year-end-reminders','https://www.irs.gov/businesses/small-businesses-self-employed/state-government-websites',`https://${code.toLowerCase()}.gov/`];}
export async function research(env,code,year,fetcher=fetch,force=false){
 if(!valid(code,year))throw Error('invalid_jurisdiction');const key=code+'/'+year,old=await load(env,key+'/state.json'),now=Date.now();
 if(!force&&old.value&&!monthlyReviewDue(old.value.checkedAt,now))return old.value;
 const evidence=[],failures=[];for(const url of seeds(code)){try{evidence.push(await source(url,fetcher));}catch(e){failures.push({url,reason:String(e.message)});}}
 const domains=new Set([code.toLowerCase()+'.gov',...(code==='PR'?['pr.gov']:['irs.gov']),...evidence.map(e=>new URL(e.url).hostname.split('.').slice(-2).join('.'))]);
 const relevant=[...new Set(evidence.flatMap(e=>e.links??[]))].filter(url=>{const host=new URL(url).hostname;return [...domains].some(domain=>host===domain||host.endsWith('.'+domain))&&!evidence.some(e=>e.url===url)&&!seeds(code).includes(url);}).slice(0,4);for(const url of relevant){try{evidence.push(await source(url,fetcher));}catch(e){failures.push({url,reason:String(e.message)});}}
 const version=crypto.randomUUID(),draft={version,jurisdiction:code,year,status:'pending',checkedAt:new Date().toISOString(),effectiveFrom:year+'-01-01',effectiveTo:year+'-12-31',coverage:{federal:'pending',state:'pending',withholding:'pending',deductions:'pending',credits:'pending',ira:'pending',forms:'pending',exceptions:'pending'},sources:evidence,failures,changes:old.value?.fingerprint!==await hash(evidence.map(e=>e.sha256).join('|'))};
 await env.BUCKET.put(prefix+key+'/history/'+version+'.json',JSON.stringify(draft));
 const state={jurisdiction:code,year,checkedAt:draft.checkedAt,fingerprint:await hash(evidence.map(e=>e.sha256).join('|')),draft:version,approved:old.value?.approved??null,pending:true};
 if(!await save(env,key+'/state.json',state,old.etag))return(await load(env,key+'/state.json')).value;
 return state;
}
export async function refreshTaxRules(env,fetcher=fetch){let cursor,checked=0;do{const page=await env.BUCKET.list({prefix,limit:1000,cursor});for(const o of page.objects.filter(o=>o.key.endsWith('/state.json'))){const parts=o.key.slice(prefix.length).split('/');await research(env,parts[0],Number(parts[1]),fetcher);checked++;}cursor=page.truncated?page.cursor:undefined;}while(cursor);return{checked};}
async function authenticated(request,env,fetcher){const auth=request.headers.get('Authorization')??'';if(!/^Bearer [A-Za-z0-9._-]{20,8192}$/.test(auth))return false;const url=env.SUPABASE_URL??'https://kvjrxcvxwoezajarvtgb.supabase.co',key=env.SUPABASE_ANON_KEY??env.SUPABASE_PUBLISHABLE_KEY;if(!key)return false;const r=await fetcher(url+'/auth/v1/user',{headers:{apikey:key,Authorization:auth},signal:AbortSignal.timeout(12000)});if(!r.ok)return false;const u=await r.json();return !!u.id&&!!u.email_confirmed_at;}
function verifiedApproval(rule,draft){
 if(rule?.additionalIraRules!==undefined&&(!Array.isArray(rule.additionalIraRules)||rule.additionalIraRules.length>8||!rule.additionalIraRules.every(ira=>verifiedApproval({...rule,ira,additionalIraRules:undefined},draft))))return false;
 const i=rule?.ira,fields=['annualLimitCents','individualLimitCents','catchUpCents','deductionLimitCents'];
 return rule?.year===draft.year&&rule?.jurisdiction===draft.jurisdiction&&i&&fields.every(k=>Number.isSafeInteger(i[k])&&i[k]>=0)&&Number.isInteger(i.catchUpAge)&&i.catchUpAge>=0&&i.catchUpAge<=125&&['none','eligible'].includes(i.deduction)&&['earned_income','requires_review'].includes(i.eligibility)&&typeof i.combinedGroup==='string'&&i.combinedGroup.length>0&&i.combinedGroup.length<80&&Array.isArray(i.types)&&i.types.length>0&&(!i.types.some(t=>t==='roth'||t==='pr_nondeductible')||i.deduction==='none')&&i.types.every(t=>['traditional','roth','pr_deductible','pr_nondeductible'].includes(t))&&Array.isArray(rule.citations)&&fields.every(k=>rule.citations.some(c=>c.field===k&&typeof c.excerpt==='string'&&c.excerpt.length>=10&&draft.sources.some(s=>s.url===c.url&&s.text.includes(c.excerpt)&&s.text.includes(String(draft.year)))))&&(!rule.brackets||(Array.isArray(rule.brackets)&&rule.brackets.length>0&&rule.brackets.length<30&&rule.brackets.at(-1).upToCents===null&&rule.brackets.every((b,index)=>Number.isInteger(b.rateBps)&&b.rateBps>=0&&b.rateBps<=10000&&(b.upToCents===null?index===rule.brackets.length-1:Number.isSafeInteger(b.upToCents)&&b.upToCents>0&&(index===0||b.upToCents>rule.brackets[index-1].upToCents)))));
}
export async function handleTaxRules(request,env,{fetcher=fetch,owner=educationOwner,authenticate=authenticated}={}){
 const url=new URL(request.url),path=url.pathname;if(request.headers.get('Origin')&&request.headers.get('Origin')!==url.origin)return json({error:'origin'},403);if(!env.BUCKET)return json({error:'storage_unavailable',status:'pending'},503);
 try{
  if(path==='/api/tax-rules/refresh'){if(!await owner(request,env))return json({error:'owner_required'},403);if(request.method!=='POST')return json({error:'method'},405);return json(await refreshTaxRules(env,fetcher));}
  if(path==='/api/tax-rules/rules'&&request.method==='GET'){const code=url.searchParams.get('jurisdiction'),year=Number(url.searchParams.get('year'));if(!valid(code,year))return json({error:'jurisdiction'},400);const {value}=await load(env,code+'/'+year+'/state.json');if(!value?.approved)return json({status:'pending',reason:'Pendiente de validación del propietario.'});const approved=await load(env,code+'/'+year+'/approved/'+value.approved+'.json');return json(approved.value??{status:'pending'});}
  if(request.method!=='POST')return json({error:'method'},405);const raw=await request.text();if(raw.length>24000)return json({error:'size'},413);const body=JSON.parse(raw);
  if(path==='/api/tax-rules/research'){if(!await authenticate(request,env,fetcher))return json({error:'signin_required'},401);if(Object.keys(body).some(k=>!['jurisdiction','year'].includes(k))||!valid(body.jurisdiction,body.year))return json({error:'jurisdiction_only'},400);return json(await research(env,body.jurisdiction,body.year,fetcher));}
  if(path!=='/api/tax-rules/admin'||!await owner(request,env))return json({error:'owner_required'},403);
  const key=body.jurisdiction+'/'+body.year;if(!valid(body.jurisdiction,body.year))return json({error:'jurisdiction'},400);const state=await load(env,key+'/state.json');if(!state.value?.draft)return json({status:'pending'});const draft=await load(env,key+'/history/'+state.value.draft+'.json');
  if(body.action==='review')return json(draft.value);
  if(body.action!=='approve'||body.reviewed!==true||body.version!==draft.value?.version||!verifiedApproval(body.rule,draft.value)||!draft.value.sources.length)return json({error:'official_review_required'},409);
  for(const s of draft.value.sources){const fresh=await source(s.url,fetcher);if(fresh.sha256!==s.sha256)return json({error:'source_changed'},409);}
  const approved={...body.rule,status:'approved',version:draft.value.version,effectiveFrom:draft.value.effectiveFrom,effectiveTo:draft.value.effectiveTo,approvedAt:new Date().toISOString(),approvedBy:'existing-edumoney-owner',sources:draft.value.sources.map(s=>({url:s.url,sha256:s.sha256,retrievedAt:s.retrievedAt,excerpt:body.rule.citations.filter(c=>c.url===s.url).map(c=>c.excerpt).join('\n')})).filter(s=>s.excerpt)};
  await env.BUCKET.put(prefix+key+'/approved/'+approved.version+'.json',JSON.stringify(approved));if(!await save(env,key+'/state.json',{...state.value,approved:approved.version,pending:false},state.etag))return json({error:'conflict'},409);return json({status:'approved',version:approved.version});
 }catch{return json({status:'pending',error:'verification_unavailable'},503);}
}

export async function taxRulesStatus(env){const page=await env.BUCKET.list({prefix,limit:1000});const jurisdictions=[];for(const o of page.objects.filter(o=>o.key.endsWith('/state.json'))){const record=await env.BUCKET.get(o.key);jurisdictions.push(await record.json());}return {jurisdictions,truncated:page.truncated};}
