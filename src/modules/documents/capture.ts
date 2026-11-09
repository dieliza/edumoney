import type { ImageData } from './types';
export interface CaptureResult {image:ImageData;text:string;warning:string}
export async function captureImage(_source:'camera'|'library'):Promise<CaptureResult|null>{throw new Error('La captura necesita la aplicación nativa.');}
export async function loadOCRFixture():Promise<CaptureResult>{throw new Error('Solo disponible en la compilación nativa de pruebas.');}
