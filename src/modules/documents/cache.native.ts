import { Directory,Paths } from 'expo-file-system';
/** Exclusivamente temporales de captura y exportación elegida; nunca fotos originales ni Documents. */
export function cleanCaptureCache(){for(const name of ['edumoney-intake','ImagePicker','edumoney-cpa-export','edumoney-backup-export','edumoney-closure-export']){const dir=new Directory(Paths.cache,name);if(dir.exists)dir.delete();}}
