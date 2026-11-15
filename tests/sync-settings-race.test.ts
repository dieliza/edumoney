import {expect,it,vi} from 'vitest';
import {setWebSettings,updateWebSettings} from '../src/web/syncSettings';
const state=vi.hoisted(()=>({value:{code:'old'} as unknown,release:undefined as undefined|(()=>void)}));
vi.mock('../src/web/vault',()=>({getWebSettings:async()=>{await new Promise<void>(r=>state.release=r);return structuredClone(state.value);},setWebSettings:async(value:unknown)=>{state.value=value;}}));
it('disconnecting while a backup updates metadata cannot resurrect its old pairing code',async()=>{const updating=updateWebSettings<{code?:string;etag?:string}>(value=>value?.code==='old'?{...value,etag:'version'}:undefined);await Promise.resolve();const disconnect=setWebSettings({automatic:false});state.release!();await Promise.all([updating,disconnect]);expect(state.value).toEqual({automatic:false});});
