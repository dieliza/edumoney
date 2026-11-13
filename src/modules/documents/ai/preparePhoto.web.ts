import {UserInputError} from '../../../core/errors';
import type {ImageData} from '../types';
// Adaptación tipada de src/utils/receiptPhoto.js de PR Budget@3d108af34a6b3b13b7556ab5866a42ed8ff66b7c.
export async function prepareGeminiPhoto(file:File):Promise<ImageData>{
 if(!file.type.startsWith('image/')||!file.size||file.size>30*1024*1024)throw new UserInputError('Selecciona una foto de hasta 30 MB.');
 let image:ImageBitmap|HTMLImageElement;
 try{try{image=await createImageBitmap(file,{imageOrientation:'from-image'});}catch{const url=URL.createObjectURL(file);try{const img=new Image();img.src=url;await img.decode();image=img;}finally{URL.revokeObjectURL(url);}}}catch{throw new UserInputError('No se pudo abrir esta foto. Prueba con JPG o PNG; tus datos escritos se conservan.');}
 const width=image.width,height=image.height;if(!width||!height)throw new UserInputError('La foto no tiene dimensiones válidas.');
 const scale=Math.min(1,2000/Math.max(width,height)),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(width*scale));canvas.height=Math.max(1,Math.round(height*scale));
 try{const ctx=canvas.getContext('2d');if(!ctx)throw new UserInputError('No se pudo preparar la foto.');ctx.drawImage(image,0,0,canvas.width,canvas.height);if('close' in image)image.close();const blob=await new Promise<Blob|null>(resolve=>canvas.toBlob(resolve,'image/jpeg',.85));if(!blob||blob.size>3500000)throw new UserInputError('La foto preparada supera 3,5 MB. Recorta los fondos o toma otra más cercana.');const bytes=new Uint8Array(await blob.arrayBuffer());let binary='';for(let i=0;i<bytes.length;i+=0x8000)binary+=String.fromCharCode(...bytes.subarray(i,i+0x8000));return {mime:'image/jpeg',base64:btoa(binary)};}finally{canvas.width=canvas.height=1;}
}
