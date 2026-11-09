import { File,Directory,Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { UserInputError } from '../../../core/errors';
export async function sharePayroll(data:string|Uint8Array,format:'csv'|'pdf') {if(!await Sharing.isAvailableAsync())throw new UserInputError('Compartir no está disponible en este dispositivo.');const dir=new Directory(Paths.cache,'edumoney-cpa-export');if(dir.exists)dir.delete();dir.create({intermediates:true,idempotent:true});try{const f=new File(dir,`EduMoney-Nomina-Borrador.${format}`);f.write(data);await Sharing.shareAsync(f.uri,{mimeType:format==='pdf'?'application/pdf':'text/csv',dialogTitle:'Compartir borrador de nómina por código de empleado'});}finally{if(dir.exists)dir.delete();}}
