/** La instalación nativa no tiene un cierre de sesión autenticado equivalente. */
export const canCloseSection=false;
export function closeSection():never{throw Error('Esta instalación requiere un mecanismo de cierre seguro nativo antes de ofrecer esta opción.');}
