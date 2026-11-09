import { schemaV1 } from './schema';
import { schemaV2 } from './schemaV2';
import { schemaV3 } from './schemaV3';
import { schemaV4 } from './schemaV4';
import { schemaV5 } from './schemaV5';
import { schemaV6 } from './schemaV6';
import { schemaV7 } from './schemaV7';
import { schemaV8 } from './schemaV8';
import { schemaV9 } from './schemaV9';
import { schemaV10 } from './schemaV10';
import { schemaV11 } from './schemaV11';
import { schemaV12 } from './schemaV12';
export interface MigrationDb {
  execAsync(sql: string): Promise<void>;
  getFirstAsync<T>(sql: string): Promise<T | null>;
}
/** La conexión debe estar cifrada y validada antes de llamar aquí. */
export async function migrate(db: MigrationDb): Promise<void> {
  await db.execAsync('PRAGMA foreign_keys = ON;');
  const version = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version;');
  if (!version || version.user_version > 12) throw new Error('Versión de datos no compatible');
  if (version.user_version === 12) return;
  await db.execAsync('BEGIN IMMEDIATE;');
  try {
    if (version.user_version === 0) await db.execAsync(schemaV1);
    if (version.user_version < 2) await db.execAsync(schemaV2);
    if (version.user_version < 3) await db.execAsync(schemaV3);
    if (version.user_version < 4) await db.execAsync(schemaV4);
    if (version.user_version < 5) await db.execAsync(schemaV5);
    if (version.user_version < 6) await db.execAsync(schemaV6);
    if (version.user_version < 7) await db.execAsync(schemaV7);
    if (version.user_version < 8) await db.execAsync(schemaV8);
    if (version.user_version < 9) await db.execAsync(schemaV9);
    if (version.user_version < 10) await db.execAsync(schemaV10);
    if (version.user_version < 11) await db.execAsync(schemaV11);
    await db.execAsync(schemaV12);
    await db.execAsync('PRAGMA user_version = 12;');
    await db.execAsync('COMMIT;');
  } catch (error) {
    await db.execAsync('ROLLBACK;');
    throw error;
  }
}
