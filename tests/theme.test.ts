import { describe, expect, it, vi } from 'vitest';
import { parsePreference, resolveTheme } from '../src/design/tokens';
import { createThemePreferences, THEME_KEY } from '../src/design/preference';
describe('Tema local', () => {
  it('sigue cambios del dispositivo solo en automático', () => {
    expect(resolveTheme('automatic', 'dark')).toBe('dark');
    expect(resolveTheme('automatic', 'light')).toBe('light');
    expect(resolveTheme('automatic', null)).toBe('light');
    expect(resolveTheme('light', 'dark')).toBe('light');
    expect(resolveTheme('dark', 'light')).toBe('dark');
  });
  it('recupera valores válidos y tolera una preferencia antigua o ausente', () => {
    expect(parsePreference('dark')).toBe('dark');
    expect(parsePreference(null)).toBe('automatic');
    expect(parsePreference('invalid')).toBe('automatic');
  });
  it('conserva la última elección al cambiar rápidamente y al reiniciar', async () => {
    let stored: string | null = null;
    const storage = { getItem: async (key: string) => { expect(key).toBe(THEME_KEY); return stored; },
      setItem: vi.fn(async (_key: string, value: string) => { stored = value; }) };
    const preferences = createThemePreferences(storage);
    await Promise.all([preferences.write('dark'), preferences.write('light'), preferences.write('automatic')]);
    expect(await createThemePreferences(storage).read()).toBe('automatic');
    expect(storage.setItem.mock.calls.map(call => call[1])).toEqual(['dark', 'light', 'automatic']);
  });
  it('propaga fallos de escritura y permite reintentar', async () => {
    const setItem = vi.fn().mockRejectedValueOnce(new Error('full')).mockResolvedValueOnce(undefined);
    const preferences = createThemePreferences({ getItem: async () => null, setItem });
    await expect(preferences.write('dark')).rejects.toThrow('full');
    await expect(preferences.write('light')).resolves.toBeUndefined();
  });
});
