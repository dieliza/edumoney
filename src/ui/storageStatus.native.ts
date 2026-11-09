import { cleanCaptureCache } from '../modules/documents/cache';
import { openLocalDatabase } from '../storage/database';
export async function prepareStorage(): Promise<'preview' | 'ready'> {
  cleanCaptureCache();
  await openLocalDatabase();
  return 'ready';
}
