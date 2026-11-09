import { File,Directory,Paths } from 'expo-file-system';
import * as Picker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import { UserInputError } from '../../core/errors';
import { MAX_BACKUP_CHARS } from './crypto';
export async function shareBackup(text:string){if(!await Sharing.isAvailableAsync())throw new UserInputError('No hay diálogo de compartir disponible.');const dir=new Directory(Paths.cache,'edumoney-backup-export');dir.create({idempotent:true,intermediates:true});const file=new File(dir,'EduMoney-respaldo-cifrado.json');try{file.write(text);await Sharing.shareAsync(file.uri,{mimeType:'application/json',UTI:'public.json',dialogTitle:'Guardar respaldo cifrado de EduMoney'});}finally{if(dir.exists)dir.delete();}}
export async function pickBackup(){const r=await Picker.getDocumentAsync({type:['application/json','application/octet-stream'],copyToCacheDirectory:true,multiple:false});if(r.canceled)return null;const f=new File(r.assets[0].uri);try{if(!f.exists||f.size>MAX_BACKUP_CHARS)throw new UserInputError('Archivo de respaldo demasiado grande o no disponible.');return await f.text();}finally{if(f.exists)f.delete();}}
