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

function contrast(a:string,b:string){const luminance=(hex:string)=>{const rgb=hex.slice(1).match(/../g)!.map(v=>parseInt(v,16)/255).map(v=>v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4);return rgb[0]*0.2126+rgb[1]*0.7152+rgb[2]*0.0722;};const x=luminance(a),y=luminance(b);return(Math.max(x,y)+0.05)/(Math.min(x,y)+0.05);}
for(const theme of ['light','dark'] as const)it(`el formulario mantiene contraste legible en ${theme}`,async()=>{const {transactionFormColors}=await import('../src/ui/transactionFormStyle');const c=transactionFormColors(theme);for(const [ink,background] of [[c.text,c.background],[c.muted,c.background],[c.link,c.background],[c.error,c.background],[c.fieldInk,c.field],[c.text,c.active],[c.muted,c.neutral],[c.onAccent,c.expense],[c.onAccent,c.income],[c.onAccent,c.save]])expect(contrast(ink,background)).toBeGreaterThanOrEqual(4.5);});
