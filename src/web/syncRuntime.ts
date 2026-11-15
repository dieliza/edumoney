export const syncRandom=(n:number)=>crypto.getRandomValues(new Uint8Array(n));
export const syncEndpoint=()=>'/api/sync';
