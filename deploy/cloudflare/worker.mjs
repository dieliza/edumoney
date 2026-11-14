// Preparado para un alojamiento propio. No se despliega con Sites ni contiene credenciales.
import {handleSync} from '../../web-server/sync.mjs';
import {handleAnthropicReader,handleAnthropicActivation} from '../../web-server/anthropic-reader.mjs';
export default {async fetch(request,env){
 const path=new URL(request.url).pathname;
 if(path==='/api/sync')return handleSync(request,env);
 if(path==='/api/receipt-read')return handleAnthropicReader(request,env);
 if(path==='/api/receipt-reader-activation')return handleAnthropicActivation(request,env);
 if(path.startsWith('/api/'))return new Response('No encontrado',{status:404});
 const response=await env.ASSETS.fetch(request);const headers=new Headers(response.headers);
 headers.set('X-Content-Type-Options','nosniff');headers.set('Referrer-Policy','no-referrer');headers.set('Permissions-Policy','microphone=(),camera=(self)');
 if(path==='/'||path==='/sw.js'||headers.get('Content-Type')?.includes('text/html'))headers.set('Cache-Control','no-cache');
 return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
}};
