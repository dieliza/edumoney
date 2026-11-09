import { beforeEach,describe,it,expect,vi } from 'vitest';
import { shareTaxExport } from '../src/modules/tax/export.native';
import { buildExport } from '../src/modules/tax/domain';
const mock=vi.hoisted(()=>({available:true,files:new Map<string,string>(),deleted:[] as string[],share:vi.fn()}));
vi.mock('expo-sharing',()=>({isAvailableAsync:async()=>mock.available,shareAsync:mock.share}));
vi.mock('expo-file-system',()=>{const path=(p:(string|{uri:string})[])=>p.map(x=>typeof x==='string'?x:x.uri).join('/');class Directory{uri:string;constructor(...p:(string|{uri:string})[]){this.uri=path(p);}get exists(){return [...mock.files.keys()].some(k=>k.startsWith(this.uri));}create(){}delete(){for(const k of mock.files.keys())if(k.startsWith(this.uri))mock.files.delete(k);mock.deleted.push(this.uri);}}class File{uri:string;constructor(...p:(string|{uri:string})[]){this.uri=path(p);}write(text:string){mock.files.set(this.uri,text);}}return {Directory,File,Paths:{cache:{uri:'file:///cache'}}};});
const report=()=>buildExport({year:2026,profile:null,entries:[],statements:[],links:[],movements:[],documents:[]},false,[]);
beforeEach(()=>{mock.available=true;mock.files.clear();mock.deleted=[];vi.clearAllMocks();mock.share.mockResolvedValue(undefined);});
describe('Exportación elegida de Etapa 9',()=>{
 it('sin diálogo disponible no crea archivos ni intenta enviar',async()=>{mock.available=false;await expect(shareTaxExport(report(),[],'json')).rejects.toThrow('disponible');expect(mock.files.size).toBe(0);expect(mock.share).not.toHaveBeenCalled();});
 it('JSON se comparte como archivo local y elimina temporales al cerrar el diálogo',async()=>{let contents='';mock.share.mockImplementation(async(uri:string)=>{contents=mock.files.get(uri)!;});await shareTaxExport(report(),[],'json');expect(JSON.parse(contents)).toMatchObject({format:'EduMoney-CPA-v1',profile:null,copies:[]});expect(mock.share).toHaveBeenCalledWith('file:///cache/edumoney-cpa-export/EduMoney-CPA-2026.json',expect.objectContaining({mimeType:'application/json'}));expect(mock.files.size).toBe(0);});
 it('cancelación o error no deja copia en texto claro',async()=>{mock.share.mockRejectedValue(Error('cancelled'));await expect(shareTaxExport(report(),[],'json')).rejects.toThrow('cancelled');expect(mock.files.size).toBe(0);expect(mock.deleted).toContain('file:///cache/edumoney-cpa-export');});
 it('CSV no incluye perfil ni copias y se limpia después de compartir',async()=>{let contents='';mock.share.mockImplementation(async(uri:string)=>{contents=mock.files.get(uri)!;});await shareTaxExport(report(),[{id:'secret',mime:'image/jpeg',base64:'PRIVATE'}],'csv');expect(contents).toBe('\uFEFF'+report().csv);expect(contents).not.toContain('PRIVATE');expect(mock.files.size).toBe(0);});
});
