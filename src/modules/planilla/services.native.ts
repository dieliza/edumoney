import { File,Directory,Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type { Closure } from './engine';
import { evaluateClosure } from './engine';
import { UserInputError } from '../../core/errors';
export async function generateClosurePDF(c:Closure,mode:'review'|'laboratory'='review'){
 let template:Uint8Array|undefined;
 if(c.year===2025){const {Asset}=await import('expo-asset');const bundled=Asset.fromModule(require('../../../assets/tax/2025/form-482-informativo.pdf'));if(/^https?:/.test(bundled.uri))throw new UserInputError('La plantilla oficial debe estar incluida en la aplicación para generar el PDF sin conexión.');const asset=new Asset({name:bundled.name,uri:bundled.uri,type:bundled.type});await asset.downloadAsync();if(!asset.localUri?.startsWith('file://'))throw new UserInputError('No se encontró la plantilla local.');template=await new File(asset.localUri).bytes();}
 const {buildClosurePDF}=await import('./pdf');return buildClosurePDF(c,evaluateClosure(c,mode),template);
}
export async function shareClosurePDF(c:Closure){if(!await Sharing.isAvailableAsync())throw new UserInputError('No hay diálogo de compartir disponible.');const dir=new Directory(Paths.cache,'edumoney-closure-export');dir.create({idempotent:true,intermediates:true});const f=new File(dir,`EduMoney-cierre-${c.year}-no-radicado.pdf`);try{f.write(await generateClosurePDF(c));await Sharing.shareAsync(f.uri,{mimeType:'application/pdf',UTI:'com.adobe.pdf',dialogTitle:'Compartir borrador de cierre, no radicado'});}finally{if(dir.exists)dir.delete();}}
