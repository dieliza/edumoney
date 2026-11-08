import { it, expect, vi } from 'vitest';
import { obtainDatabaseKey } from '../src/storage/key';
const key = 'ab'.repeat(32);
it('crea y persiste una clave una sola vez', async () => {
  let saved: string | null = null;
  const store = { get: async () => saved, set: async (value: string) => { saved = value; } };
  const generate = vi.fn(async () => key);
  expect(await obtainDatabaseKey(store, false, generate)).toBe(key);
  expect(await obtainDatabaseKey(store, true, generate)).toBe(key);
  expect(generate).toHaveBeenCalledTimes(1);
});
it('no reemplaza una clave perdida si existen datos', async () => {
  const set = vi.fn(); const generate = vi.fn();
  await expect(obtainDatabaseKey({ get: async () => null, set }, true, generate)).rejects.toThrow('recuperación');
  expect(set).not.toHaveBeenCalled(); expect(generate).not.toHaveBeenCalled();
});
it('propaga fallos del almacén y rechaza claves dañadas', async () => {
  await expect(obtainDatabaseKey({ get: async () => 'invalid', set: vi.fn() }, false, vi.fn())).rejects.toThrow();
  await expect(obtainDatabaseKey({ get: async () => null, set: async () => { throw new Error('locked'); } }, false, async () => key)).rejects.toThrow('locked');
});
