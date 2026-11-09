import * as Picker from 'expo-image-picker';
import { File,Directory,Paths } from 'expo-file-system';
import { extractTextFromImage,isSupported } from 'expo-text-extractor';
import { newId } from '../../core/id';
import { cleanCaptureCache } from './cache';
import { UserInputError } from '../../core/errors';
import { MAX_IMAGE_BYTES,validateImage } from './domain';
import type { ImageData } from './types';
export async function captureImage(source:'camera'|'library'){
 if(source==='camera'){const permission=await Picker.requestCameraPermissionsAsync();if(!permission.granted)throw new UserInputError('La cámara no tiene permiso. Puedes escribir la información o seleccionar una imagen.');}
 const options:Picker.ImagePickerOptions={mediaTypes:['images'],base64:false,exif:false,quality:0.7,allowsEditing:false};
 const result=source==='camera'?await Picker.launchCameraAsync(options):await Picker.launchImageLibraryAsync(options);
 if(result.canceled||!result.assets?.[0]){cleanCaptureCache();return null;}
 const original=new File(result.assets[0].uri);const folder=new Directory(Paths.cache,'edumoney-intake');folder.create({idempotent:true,intermediates:true});const owned=new File(folder,`${newId()}.img`);
 try{
 if(!original.exists||!original.size||original.size>MAX_IMAGE_BYTES)throw new UserInputError('Elige una imagen de hasta 4 MB o toma otra foto más pequeña.');
 original.copy(owned);const base64=await owned.base64();const mime=base64.startsWith('/9j/')?'image/jpeg':base64.startsWith('iVBORw0KGgo')?'image/png':null;
 if(!mime)throw new UserInputError('Usa una imagen JPEG o PNG. La información también puede escribirse manualmente.');
 const image:ImageData={base64,mime};validateImage(image);let text='',warning='';
 if(isSupported){try{text=(await extractTextFromImage(owned.uri)).join('\n').slice(0,20000);if(!text.trim())warning='No se reconoció texto. Revisa la imagen e introduce los datos manualmente.';}catch{warning='El reconocimiento local no pudo leer la imagen. Puedes completar los campos manualmente.';}}else warning='Este dispositivo no dispone de reconocimiento local. Completa los campos manualmente.';
 return {image,text,warning};
 }finally{
 if(owned.exists)owned.delete();
 // ImagePicker entrega una copia temporal; la biblioteca de fotos original nunca se elimina.
 const pickerRoot=new Directory(Paths.cache,'ImagePicker').uri.replace(/\/$/,'')+'/';
 if(original.uri.startsWith(pickerRoot)&&original.exists)original.delete();
 }
}
/** Exclusivamente para builds de validación: ejercita el OCR real con una imagen sintética incluida. */
export async function loadOCRFixture(){
 if(process.env.EXPO_PUBLIC_STAGE8_TESTS!=='1')throw new Error('Fixture deshabilitado');
 const { Asset }=await import('expo-asset');const bundled=Asset.fromModule(require('../../../assets/tests/receipt.jpg'));
 // Android image resources are marked downloaded despite lacking a file URI.
 // A fresh descriptor materializes that bundled resource into the local cache.
 const asset=new Asset({uri:bundled.uri,type:bundled.type});await asset.downloadAsync();
 const uri=asset.localUri;if(!uri?.startsWith('file://'))throw new Error('La imagen de pruebas no está incluida localmente');
 const f=new File(uri);const image:ImageData={base64:await f.base64(),mime:'image/jpeg'};validateImage(image);
 const text=(await extractTextFromImage(uri)).join('\n');return {image,text,warning:'Imagen ficticia incluida para validar el reconocimiento local. No es un comprobante real.'};
}
