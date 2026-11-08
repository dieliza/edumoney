import { Platform } from 'react-native';
import * as SQLite from 'expo-sqlite';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { File, Paths } from 'expo-file-system';
import { obtainDatabaseKey } from './key';
import { migrate } from './migrate';

const databaseName = 'edumoney.db';
const keyName = 'edumoney.database.key.v1';
let opening: Promise<SQLite.SQLiteDatabase> | undefined;
export function openLocalDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!opening) opening = open().catch(error => { opening = undefined; throw error; });
  return opening;
}
async function open(): Promise<SQLite.SQLiteDatabase> {
  if (Platform.OS === 'web') throw new Error('Se requiere iOS o Android para el almacenamiento cifrado');
  const databaseExists = new File(Paths.document, 'SQLite', databaseName).exists;
  const key = await obtainDatabaseKey({
    get: () => SecureStore.getItemAsync(keyName),
    set: value => SecureStore.setItemAsync(keyName, value, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    }),
  }, databaseExists, async () => Array.from(await Crypto.getRandomBytesAsync(32), byte => byte.toString(16).padStart(2, '0')).join(''));
  const db = await SQLite.openDatabaseAsync(databaseName);
  try {
    // Clave hex validada de 256 bits; nunca registrar la clave ni el SQL completo.
    await db.execAsync(`PRAGMA key = "x'${key}'";`);
    const cipher = await db.getFirstAsync<{ cipher_version: string }>('PRAGMA cipher_version;');
    if (!cipher?.cipher_version) throw new Error('SQLCipher no está disponible; usa una compilación nativa');
    await db.getFirstAsync('SELECT count(*) FROM sqlite_master;');
    await migrate(db);
    return db;
  } catch (error) {
    await db.closeAsync();
    throw error;
  }
}
