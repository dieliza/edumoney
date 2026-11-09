import { Directory,Paths } from 'expo-file-system';
/** Exclusivamente temporales de captura de este módulo; nunca fotos originales ni Documents. */
export function cleanCaptureCache(){for(const name of ['edumoney-intake','ImagePicker']){const dir=new Directory(Paths.cache,name);if(dir.exists)dir.delete();}}
