import {afterEach,expect,it} from 'vitest';
import {requestGeminiConsent,answerGeminiConsent,geminiConsentOpen} from '../src/web/geminiConsent';
afterEach(()=>answerGeminiConsent(false));
it('no autoriza antes de la respuesta explícita de la persona',async()=>{let settled=false;const request=requestGeminiConsent().then(v=>{settled=true;return v;});expect(geminiConsentOpen()).toBe(true);await Promise.resolve();expect(settled).toBe(false);answerGeminiConsent(true);expect(await request).toBe(true);expect(geminiConsentOpen()).toBe(false);});
it('cancelar resuelve sin autorización ni cierre de borradores',async()=>{const request=requestGeminiConsent();answerGeminiConsent(false);expect(await request).toBe(false);});
it('una solicitud posterior cancela la anterior en vez de autorizar dos fotos',async()=>{const first=requestGeminiConsent(),second=requestGeminiConsent();expect(await first).toBe(false);answerGeminiConsent(true);expect(await second).toBe(true);});
