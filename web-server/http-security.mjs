/** HTML-only policy: preserve streaming APIs, offline shell caching, camera and microphone. */
export function secureAppResponse(response) {
 if(!/^text\/html(?:;|$)/i.test(response.headers.get('Content-Type')??''))return response;
 const headers=new Headers(response.headers);
 if(!headers.has('Content-Security-Policy'))headers.set('Content-Security-Policy',"base-uri 'none'; object-src 'none'; form-action 'self'; frame-ancestors 'self' https://chatgpt.com https://*.chatgpt.com");
 if(!headers.has('X-Frame-Options'))headers.set('X-Frame-Options','SAMEORIGIN');
 headers.set('X-Content-Type-Options','nosniff');
 headers.set('Referrer-Policy','no-referrer');
 return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
}
