import {expect,it,vi} from 'vitest';
import DocumentsRoute from '../src/modules/documents/DocumentsRoute';
const state=vi.hoisted(()=>({params:{} as {source?:string;dictation?:string}}));
vi.mock('expo-router',()=>({Redirect:()=>null,useLocalSearchParams:()=>state.params}));
vi.mock('../src/modules/documents/DocumentsScreen',()=>({default:()=>null}));
it('existing voice notification links redirect to Mis dictados preserving the selected note',()=>{state.params={source:'voice',dictation:'pending-123'};const result=DocumentsRoute();expect(result.props.href).toEqual({pathname:'/dictations',params:{dictation:'pending-123'}});});
it('normal document access remains in the scanner',()=>{state.params={};expect(DocumentsRoute().props.href).toBeUndefined();});
