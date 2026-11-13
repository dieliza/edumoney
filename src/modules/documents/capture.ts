import { UserInputError } from '../../core/errors';
import { pickFile } from '../../web/files';
import type { ImageData } from './types';
export interface CaptureResult { image: ImageData; text: string; warning: string }
export async function captureImage(source: 'camera' | 'library'): Promise<CaptureResult | null> {
  const file = await pickFile('image/jpeg,image/png', source === 'camera'); if (!file) return null;
  if (!['image/jpeg', 'image/png'].includes(file.type) || file.size > 4 * 1024 * 1024) throw new UserInputError('Selecciona una imagen JPG o PNG de hasta 4 MB.');
  const base64 = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result).split(',')[1]); reader.onerror = () => reject(Error('No se pudo leer la imagen.')); reader.readAsDataURL(file); });
  return { image: { base64, mime: file.type as ImageData['mime'] }, text: '', warning: 'Imagen elegida localmente. El reconocimiento de texto no está disponible en esta versión web: escribe y confirma los datos antes de guardar.' };
}
export async function loadOCRFixture(): Promise<CaptureResult> { throw Error('El comprobante de prueba solo se utiliza en las pruebas nativas.'); }
