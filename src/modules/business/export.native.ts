import { File,Directory,Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { UserInputError } from '../../core/errors';
import type { businessExport } from './ledgerDomain';
export async function shareBusinessExport(report:ReturnType<typeof businessExport>,copies:{id:string;mime:string;base64:string}[],format:'json'|'csv') {
 if(!await Sharing.isAvailableAsync())throw new UserInputError('Compartir no está disponible; los registros permanecen guardados localmente.');
 // Carpeta ya incluida en la limpieza de temporales al iniciar EduMoney.
 const folder=new Directory(Paths.cache,'edumoney-cpa-export');if(folder.exists)folder.delete();folder.create({intermediates:true,idempotent:true});
 const file=new File(folder,`EduMoney-Negocio-CPA.${format}`);
 try{file.write(format==='json'?JSON.stringify({...report,copies},null,2):'\uFEFF'+report.csv);await Sharing.shareAsync(file.uri,{mimeType:format==='json'?'application/json':'text/csv',UTI:format==='json'?'public.json':'public.comma-separated-values-text',dialogTitle:'Compartir registros comerciales seleccionados'});}finally{if(folder.exists)folder.delete();}
}
