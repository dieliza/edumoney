export async function emailWorkspaceKey(request, env, config, fetchUser = fetch) {
  const headers = {'Cache-Control':'no-store', 'Content-Type':'text/plain','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'};
  const reply = (body, status) => new Response(body, {status, headers});
  if (request.method !== 'POST' || request.headers.get('Origin') !== new URL(request.url).origin) return reply('', 403);
  const auth = request.headers.get('Authorization') || '';
  if (!config.enabled || !/^Bearer [A-Za-z0-9._-]+$/.test(auth)) return reply('', 401);
  let user;
  try {
    const response = await fetchUser(config.url + '/auth/v1/user', {headers:{Authorization:auth, apikey:config.publishableKey},signal:AbortSignal.timeout(10000)});
    if (!response.ok) return reply('', response.status===401||response.status===403?401:503);
    user = await response.json();
  } catch { return reply('',503); }
  if (!user?.email_confirmed_at || !/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(user?.id??'')) return reply('', 403);
  let access;
  try{access=await fetchUser(config.url+'/rest/v1/edumoney_account_access?user_id=eq.'+user.id+'&select=status',{headers:{Authorization:auth,apikey:config.publishableKey},signal:AbortSignal.timeout(10000)});if(!access.ok)return reply('',503);const rows=await access.json();if(!Array.isArray(rows))return reply('',503);if(rows.some(row=>row.status!=='active'))return reply('',403);}catch{return reply('',503);}
  if (!env.BUCKET) return reply('', 503);
  const path = 'email-entry-keys/v1/' + user.id;
  let stored = await env.BUCKET.get(path);
  if (!stored) {
    const key = Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2,'0')).join('');
    if (await env.BUCKET.put(path, key, {onlyIf:{etagDoesNotMatch:'*'}})) return reply(key, 200);
    stored = await env.BUCKET.get(path);
  }
  if (!stored) return reply('', 503);
  const key = await stored.text();
  return /^[a-f0-9]{64}$/.test(key) ? reply(key, 200) : reply('', 503);
}
