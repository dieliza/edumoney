import * as Crypto from 'expo-crypto';
/** UUID v4 criptográfico, generado localmente sin identificadores del dispositivo. */
export const newId = (): string => Crypto.randomUUID();
