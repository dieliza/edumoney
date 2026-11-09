import { beforeEach,describe,expect,it,vi } from 'vitest';
import { captureImage } from '../src/modules/documents/capture.native';
const mock=vi.hoisted(()=>({permission:true,canceled:false,ocrFails:false,uri:'file:///cache/ImagePicker/original.jpg',size:100,files:new Map<string,{size:number;base64:string}>(),deleted:[] as string[],camera:vi.fn(),library:vi.fn(),ocr:vi.fn()}));
vi.mock('../src/core/id',()=>({newId:()=> 'capture-test'}));
vi.mock('expo-image-picker',()=>({requestCameraPermissionsAsync:async()=>({granted:mock.permission}),launchCameraAsync:mock.camera,launchImageLibraryAsync:mock.library}));
vi.mock('expo-text-extractor',()=>({isSupported:true,extractTextFromImage:mock.ocr}));
vi.mock('expo-file-system',()=>{
 const uri=(parts:(string|{uri:string})[])=>parts.map(p=>typeof p==='string'?p:p.uri).join('/');
 class File {uri:string;constructor(...p:(string|{uri:string})[]){this.uri=uri(p);}get exists(){return mock.files.has(this.uri);}get size(){return mock.files.get(this.uri)?.size??0;}async base64(){return mock.files.get(this.uri)!.base64;}copy(to:File){mock.files.set(to.uri,mock.files.get(this.uri)!);}delete(){mock.files.delete(this.uri);mock.deleted.push(this.uri);}}
 class Directory {uri:string;constructor(...p:(string|{uri:string})[]){this.uri=uri(p);}create(){}}
 return {File,Directory,Paths:{cache:{uri:'file:///cache'}}};
});
beforeEach(()=>{vi.clearAllMocks();mock.permission=true;mock.canceled=false;mock.ocrFails=false;mock.uri='file:///cache/ImagePicker/original.jpg';mock.size=100;mock.files.clear();mock.deleted=[];const result=async()=>{if(mock.canceled)return {canceled:true,assets:null};mock.files.set(mock.uri,{size:mock.size,base64:'/9j/AAAA'});return {canceled:false,assets:[{uri:mock.uri}]};};mock.camera.mockImplementation(result);mock.library.mockImplementation(result);mock.ocr.mockImplementation(async()=>{if(mock.ocrFails)throw Error('OCR unavailable');return ['TIENDA FICTICIA','TOTAL $55.00'];});});
describe('Etapa 8: cámara y temporales de captura',()=>{
 it('permiso de cámara denegado ofrece entrada manual sin abrir ni guardar una captura',async()=>{mock.permission=false;await expect(captureImage('camera')).rejects.toThrow('permiso');expect(mock.camera).not.toHaveBeenCalled();expect(mock.files.size).toBe(0);});
 it('cancelar selección no genera archivo ni reconocimiento',async()=>{mock.canceled=true;expect(await captureImage('library')).toBeNull();expect(mock.ocr).not.toHaveBeenCalled();expect(mock.files.size).toBe(0);});
 it('procesa archivo local y elimina sus temporales antes de devolver la revisión en memoria',async()=>{const result=await captureImage('camera');expect(result?.text).toContain('TOTAL $55.00');expect(result?.image).toMatchObject({base64:'/9j/AAAA',mime:'image/jpeg'});expect(mock.camera).toHaveBeenCalledWith(expect.objectContaining({exif:false,mediaTypes:['images']}));expect(mock.files.size).toBe(0);expect(mock.deleted).toContain('file:///cache/ImagePicker/original.jpg');});
 it('si OCR falla conserva una propuesta manual y aun así limpia las copias temporales',async()=>{mock.ocrFails=true;const result=await captureImage('library');expect(result?.text).toBe('');expect(result?.warning).toContain('manualmente');expect(mock.files.size).toBe(0);});
 it('rechaza tamaño excesivo y nunca elimina una foto original ajena a ImagePicker',async()=>{mock.size=5*1024*1024;await expect(captureImage('library')).rejects.toThrow('4 MB');expect(mock.files.size).toBe(0);mock.size=100;mock.uri='file:///Photos/original.jpg';await captureImage('library');expect(mock.files.has(mock.uri)).toBe(true);expect(mock.deleted).not.toContain(mock.uri);});
});
