import { openLocalDatabase } from '../storage/database';
export async function prepareStorage(): Promise<'preview' | 'ready'> {
  await openLocalDatabase();
  return 'ready';
}
