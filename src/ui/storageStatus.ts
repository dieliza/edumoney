/** La web es una vista de demostración: no abre bases financieras. */
export async function prepareStorage(): Promise<'preview' | 'ready'> { return 'preview'; }
