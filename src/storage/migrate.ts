import { schemaV1 } from './schema';
export interface MigrationDb {
  execAsync(sql: string): Promise<void>;
  getFirstAsync<T>(sql: string): Promise<T | null>;
}
/** La conexión debe estar cifrada y validada antes de llamar aquí. */
export async function migrate(db: MigrationDb): Promise<void> {
  await db.execAsync('PRAGMA foreign_keys = ON;');
  const version = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version;');
  if (!version || version.user_version > 1) throw new Error('Versión de datos no compatible');
  if (version.user_version === 1) return;
  await db.execAsync('BEGIN IMMEDIATE;');
  try {
    await db.execAsync(schemaV1);
    await db.execAsync('PRAGMA user_version = 1;');
    await db.execAsync('COMMIT;');
  } catch (error) {
    await db.execAsync('ROLLBACK;');
    throw error;
  }
}
