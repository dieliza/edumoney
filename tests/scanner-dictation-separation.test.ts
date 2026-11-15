import {expect,it} from 'vitest';
import {isScannerDocument} from '../src/modules/documents/filters';
it('scanner excludes all voice records while keeping photos and manual documents',()=>{for(const source of ['camera','library','manual'] as const)expect(isScannerDocument({source})).toBe(true);expect(isScannerDocument({source:'voice'})).toBe(false);});
