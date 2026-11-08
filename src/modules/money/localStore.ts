import type { MoneyStore } from './store';
/** La web no acepta datos financieros: SQLCipher está disponible solo en la app nativa. */
export async function getMoneyStore():Promise<MoneyStore>{throw new Error('El registro cifrado requiere la app iOS o Android.');}
export const isPreview = true;
