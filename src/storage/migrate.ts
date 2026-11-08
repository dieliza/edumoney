import { schemaV1 } from './schema';
import { schemaV2 } from './schemaV2';
import { schemaV3 } from './schemaV3';
import { schemaV4 } from './schemaV4';
export interface MigrationDb {
  execAsync(sql: string): Promise<void>;
  getFirstAsync<T>(sql: string): Promise<T | null>;
}
/** La conexión debe estar cifrada y validada antes de llamar aquí. */
export async function migrate(db: MigrationDb): Promise<void> {
  await db.execAsync('PRAGMA foreign_keys = ON;');
  const version = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version;');
  if (!version || version.user_version > 4) throw new Error('Versión de datos no compatible');
  if (version.user_version === 4) return;
  await db.execAsync('BEGIN IMMEDIATE;');
  try {
    if (version.user_version === 0) await db.execAsync(schemaV1);
    if (version.user_version < 2) await db.execAsync(schemaV2);
    if (version.user_version < 3) await db.execAsync(schemaV3);
    await db.execAsync(schemaV4);
    await db.execAsync('PRAGMA user_version = 4;');
    await db.execAsync('COMMIT;');
  } catch (error) {
    await db.execAsync('ROLLBACK;');
    throw error;
  }
}
