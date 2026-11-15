import * as Crypto from 'expo-crypto';
export const syncRandom=(n:number)=>Crypto.getRandomValues(new Uint8Array(n));
export const syncEndpoint=()=>'https://edumoney-web.diegoluissantospabon.chatgpt.site/api/sync';
