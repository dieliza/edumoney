import { parsePreference, type ThemePreference } from './tokens';
export const THEME_KEY = 'edumoney.theme.v1';
export interface PreferenceStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}
/** Serializa cambios rápidos para que la última elección sea la que persiste. */
export function createThemePreferences(storage: PreferenceStorage) {
  let pending: Promise<void> = Promise.resolve();
  return {
    read: async () => parsePreference(await storage.getItem(THEME_KEY)),
    write(preference: ThemePreference): Promise<void> {
      const write = pending.catch(() => undefined).then(() => storage.setItem(THEME_KEY, preference));
      pending = write;
      return write;
    },
  };
}
