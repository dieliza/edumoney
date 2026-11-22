export const randomUUID=()=>crypto.randomUUID();
export const CryptoDigestAlgorithm={SHA256:'SHA-256'};
export async function digestStringAsync(algorithm:string,value:string){const bytes=await crypto.subtle.digest(algorithm,new TextEncoder().encode(value));return Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');}
