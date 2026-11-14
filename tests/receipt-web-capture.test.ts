import {beforeEach,expect,it,vi} from 'vitest';
import {activateAnthropic,activateLocalReader} from '../src/web/anthropicSession';
import {captureImage} from '../src/modules/documents/capture';
const mock=vi.hoisted(()=>({pick:vi.fn(),read:vi.fn(),anthropic:vi.fn()}));
vi.mock('../src/modules/documents/ai/readPhoto.web',()=>({readAnthropicPhoto:mock.anthropic}));
vi.mock('../src/web/files',()=>({pickFile:mock.pick}));
vi.mock('../src/modules/documents/photo.web',()=>({readReceiptPhoto:mock.read}));
beforeEach(()=>{activateLocalReader();vi.clearAllMocks();mock.read.mockResolvedValue({image:{mime:'image/jpeg',base64:'/9j/AAAA'},text:'TOTAL 55.00',warning:''});});
it.each(['camera','library'] as const)('envía la foto ya elegida desde %s al OCR existente sin abrir otro selector',async source=>{const file=new File(['FICTICIO'],'foto.webp',{type:'image/webp'});expect((await captureImage(source,file))?.text).toBe('TOTAL 55.00');expect(mock.read).toHaveBeenCalledWith(file);expect(mock.pick).not.toHaveBeenCalled();});
it('si el selector alternativo se cancela no ejecuta OCR',async()=>{mock.pick.mockResolvedValue(null);expect(await captureImage('camera')).toBeNull();expect(mock.pick).toHaveBeenCalledWith('image/*',true);expect(mock.read).not.toHaveBeenCalled();});
it('rechaza archivos ajenos a imagen antes de procesarlos',async()=>{await expect(captureImage('library',new File(['FICTICIO'],'archivo.txt',{type:'text/plain'}))).rejects.toThrow('foto');expect(mock.read).not.toHaveBeenCalled();});
it('rechaza fotos mayores de 32 MB antes de procesarlas',async()=>{const file={name:'grande.jpg',type:'image/jpeg',size:33*1024*1024} as File;await expect(captureImage('camera',file)).rejects.toThrow('32 MB');expect(mock.read).not.toHaveBeenCalled();});
it('si el navegador no convierte una foto HEIC informa cómo reintentar',async()=>{mock.read.mockRejectedValue(Error('Formato no disponible'));await expect(captureImage('library',new File(['FICTICIO'],'foto.heic',{type:'image/heic'}))).rejects.toThrow('JPG o PNG');});

it('cuando Anthropic está activo entrega su resultado estructurado sin pasar por OCR local',async()=>{activateAnthropic('sk-ant-CLAVE_FICTICIA_1234567890');const result={image:{mime:'image/jpeg',base64:'/9j/AAAA'},text:'TOTAL 55.00',warning:'Anthropic',structured:{document_type:'receipt',total_paid_cents:5500}};mock.anthropic.mockResolvedValue(result);const file=new File(['FICTICIO'],'foto.jpg',{type:'image/jpeg'});expect(await captureImage('library',file)).toBe(result);expect(mock.anthropic).toHaveBeenCalledWith(file);expect(mock.read).not.toHaveBeenCalled();activateLocalReader();});
it('un fallo de Anthropic no se sustituye silenciosamente por la lectura local',async()=>{activateAnthropic('sk-ant-CLAVE_FICTICIA_1234567890');mock.anthropic.mockRejectedValue(Error('Cuota agotada'));await expect(captureImage('camera',new File(['FICTICIO'],'foto.jpg',{type:'image/jpeg'}))).rejects.toThrow('Cuota agotada');expect(mock.read).not.toHaveBeenCalled();activateLocalReader();});
