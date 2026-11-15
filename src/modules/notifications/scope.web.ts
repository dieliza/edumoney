import {webVaultFingerprint} from '../../web/vault';
export async function notificationScope(){const id=await webVaultFingerprint();if(!id)throw Error('Desbloquea tu espacio para abrir sus avisos.');return id;}
