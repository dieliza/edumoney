import {schemaV23} from './schemaV23';
import {schemaV22} from './schemaV22';
import {schemaV21} from './schemaV21';
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
import { schemaV13 } from './schemaV13';
import { schemaV14 } from './schemaV14';
import { schemaV15 } from './schemaV15';
import { schemaV16 } from './schemaV16';
import { schemaV17 } from './schemaV17';
import { schemaV18 } from './schemaV18';
import {schemaV20} from './schemaV20';
import { schemaV19 } from './schemaV19';
export interface MigrationDb {
  execAsync(sql: string): Promise<void>;
  getFirstAsync<T>(sql: string): Promise<T | null>;
}
/** La conexión debe estar cifrada y validada antes de llamar aquí. */
export async function migrate(db: MigrationDb): Promise<void> {
  await db.execAsync('PRAGMA foreign_keys = ON;');
  const version = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version;');
  if (!version || version.user_version > 23) throw new Error('Versión de datos no compatible');
  if (version.user_version === 23) return;
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
    if (version.user_version < 12) await db.execAsync(schemaV12);
    if (version.user_version < 13) await db.execAsync(schemaV13);
    if (version.user_version < 14) await db.execAsync(schemaV14);
    if (version.user_version < 15) await db.execAsync(schemaV15);
    if (version.user_version < 16) await db.execAsync(schemaV16);
    if (version.user_version < 17) await db.execAsync(schemaV17);
    if (version.user_version < 18) await db.execAsync(schemaV18);
    if (version.user_version < 19) await db.execAsync(schemaV19);
    if (version.user_version < 20) await db.execAsync(schemaV20);
    if(version.user_version<21)await db.execAsync(schemaV21);
    if(version.user_version<22)await db.execAsync(schemaV22);
    await db.execAsync(schemaV23);
    await db.execAsync('PRAGMA user_version = 23;');
    await db.execAsync('COMMIT;');
  } catch (error) {
    await db.execAsync('ROLLBACK;');
    throw error;
  }
}
