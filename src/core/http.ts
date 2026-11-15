/** Portable timeout for web and React Native; does not require AbortSignal.timeout. */
export async function fetchWithTimeout(url:string,options:RequestInit={},milliseconds=30000){const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),milliseconds);try{return await fetch(url,{...options,signal:controller.signal});}finally{clearTimeout(timer);}}
