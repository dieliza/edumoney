import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as Picker from 'expo-image-picker';
import { File,Directory,Paths } from 'expo-file-system';
import { extractTextFromImage,isSupported } from 'expo-text-extractor';
import { newId } from '../../core/id';
import { cleanCaptureCache } from './cache';
import { UserInputError } from '../../core/errors';
import { MAX_IMAGE_BYTES,validateImage } from './domain';
import type { ImageData, CaptureResult } from './types';
export async function captureImage(source:'camera'|'library'):Promise<CaptureResult|null>{
 if(source==='camera'){const permission=await Picker.requestCameraPermissionsAsync();if(!permission.granted)throw new UserInputError('La cámara no tiene permiso. Puedes escribir la información o seleccionar una imagen.');}
 const options:Picker.ImagePickerOptions={mediaTypes:['images'],base64:false,exif:false,quality:1,allowsEditing:false};
 const result=source==='camera'?await Picker.launchCameraAsync(options):await Picker.launchImageLibraryAsync(options);
 if(result.canceled||!result.assets?.[0]){cleanCaptureCache();return null;}
 const original=new File(result.assets[0].uri);const folder=new Directory(Paths.cache,'edumoney-intake');folder.create({idempotent:true,intermediates:true});const owned=new File(folder,`${newId()}.jpg`);let prepared:File|undefined;
 try{
 if(!original.exists||!original.size||original.size>32*1024*1024)throw new UserInputError('Elige una foto de hasta 32 MB para prepararla localmente.');
 const asset=result.assets[0];const context=ImageManipulator.manipulate(original.uri);
 if(Math.max(asset.width,asset.height)>2400)context.resize(asset.width>=asset.height?{width:2400}:{height:2400});
 const normalized=await (await context.renderAsync()).saveAsync({format:SaveFormat.JPEG,compress:0.94});
 prepared=new File(normalized.uri);if(prepared.size>MAX_IMAGE_BYTES)throw new UserInputError('La foto preparada supera 4 MB. Acerca la cámara al recibo y evita fondos innecesarios.');prepared.copy(owned);const base64=await owned.base64();const mime=base64.startsWith('/9j/')?'image/jpeg':base64.startsWith('iVBORw0KGgo')?'image/png':null;
 if(!mime)throw new UserInputError('Usa una imagen JPEG o PNG. La información también puede escribirse manualmente.');
 const image:ImageData={base64,mime};validateImage(image);let text='',warning='';
 if(isSupported){try{text=(await extractTextFromImage(owned.uri)).join('\n').slice(0,20000);if(!text.trim())warning='No se reconoció texto. Revisa la imagen e introduce los datos manualmente.';}catch{warning='El reconocimiento local no pudo leer la imagen. Puedes completar los campos manualmente.';}}else warning='Este dispositivo no dispone de reconocimiento local. Completa los campos manualmente.';
 return {image,text,warning};
 }finally{
 if(owned.exists)owned.delete();if(prepared?.exists)prepared.delete();
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
 const asset=new Asset({name:bundled.name,uri:bundled.uri,type:bundled.type});await asset.downloadAsync();
 const uri=asset.localUri;if(!uri?.startsWith('file://'))throw new Error('La imagen de pruebas no está incluida localmente');
 const f=new File(uri);const image:ImageData={base64:await f.base64(),mime:'image/jpeg'};validateImage(image);
 const text=(await extractTextFromImage(uri)).join('\n');return {image,text,warning:'Imagen ficticia incluida para validar el reconocimiento local. No es un comprobante real.'};
}
