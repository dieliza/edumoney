export interface KeyStore {
  get(): Promise<string | null>;
  set(value: string): Promise<void>;
}
/** Nunca crear otra clave encima de una base existente inaccesible. */
export async function obtainDatabaseKey(store: KeyStore, databaseExists: boolean, generate: () => Promise<string>): Promise<string> {
  const existing = await store.get();
  if (existing !== null) {
    if (!/^[a-f0-9]{64}$/.test(existing)) throw new Error('Clave local no válida');
    return existing;
  }
  if (databaseExists) throw new Error('Falta la clave de la base existente; se requiere recuperación');
  const value = await generate();
  if (!/^[a-f0-9]{64}$/.test(value)) throw new Error('Clave generada no válida');
  await store.set(value);
  return value;
}
