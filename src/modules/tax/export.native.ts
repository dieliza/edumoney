import { File,Directory,Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { UserInputError } from '../../core/errors';
import type { buildExport } from './domain';
/** Archivo legible solo por elección explícita; nunca se envía automáticamente. */
export async function shareTaxExport(report:ReturnType<typeof buildExport>,copies:{id:string;mime:string;base64:string}[],format:'json'|'csv'){
 if(!await Sharing.isAvailableAsync())throw new UserInputError('Compartir archivos no está disponible. El expediente sigue guardado localmente.');
 const folder=new Directory(Paths.cache,'edumoney-cpa-export');if(folder.exists)folder.delete();folder.create({intermediates:true,idempotent:true});
 const file=new File(folder,`EduMoney-CPA-${report.year}.${format}`);
 try{file.write(format==='json'?JSON.stringify({...report,copies},null,2):'\uFEFF'+report.csv);await Sharing.shareAsync(file.uri,{mimeType:format==='json'?'application/json':'text/csv',UTI:format==='json'?'public.json':'public.comma-separated-values-text',dialogTitle:'Compartir expediente elegido para revisión del contable'});}finally{if(folder.exists)folder.delete();}
}
