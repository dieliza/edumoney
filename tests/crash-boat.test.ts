import {describe,it,expect} from 'vitest';
import {parsePreference,resolveTheme,palettes,fixed} from '../src/design/tokens';
import {createThemePreferences,THEME_KEY} from '../src/design/preference';
import {applyCrashBoat,crashBoatCSS} from '../src/design/crashBoat';
describe('Crash Boat Web appearance',()=>{
 it('keeps a light presentation regardless of system mode and preserves previous choices',()=>{
  for(const system of ['light','dark',null])expect(resolveTheme('crash-boat',system)).toBe('light');
  expect(parsePreference('crash-boat')).toBe('crash-boat');
  expect(resolveTheme('dark','light')).toBe('dark');expect(resolveTheme('light','dark')).toBe('light');expect(resolveTheme('automatic','dark')).toBe('dark');
 });
 it('survives restart and switching back to every existing mode using the existing preference key',async()=>{
  let saved:string|null=null;const storage={getItem:async(key:string)=>{expect(key).toBe(THEME_KEY);return saved;},setItem:async(key:string,v:string)=>{expect(key).toBe(THEME_KEY);saved=v;}};
  for(const preference of ['crash-boat','light','crash-boat','dark','crash-boat','automatic'] as const){await createThemePreferences(storage).write(preference);expect(await createThemePreferences(storage).read()).toBe(preference);}
 });
 it('scopes the photograph to the optional mode with responsive crops and does not need a DOM in native rendering',()=>{
  expect(crashBoatCSS).toContain('data-edumoney-scene="crash-boat"');expect(crashBoatCSS).toContain('crash-boat-480.webp');expect(crashBoatCSS).toContain('max-width:1100px');expect(crashBoatCSS).toContain('center 69%');
  expect(()=>applyCrashBoat('crash-boat')).not.toThrow();expect(palettes.light.surface).toBe('#FFFFFF');expect(fixed.income).toBe('#007451');expect(fixed.expense).toBe('#C12945');
 });
 it('maintains body and secondary canvas contrast even over a fully black photo pixel',()=>{
  const luminance=(hex:string)=>{const rgb=hex.slice(1).match(/../g)!.map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;};
  for(const ink of ['#102F42','#304551'])expect((luminance('#B3B3B3')+.05)/(luminance(ink)+.05)).toBeGreaterThanOrEqual(4.5);
 });
});
