import { readReceiptPhoto } from './photo.web';
import { UserInputError } from '../../core/errors';
import { pickFile } from '../../web/files';
import type { ImageData, CaptureResult } from './types';
export type { CaptureResult } from './types';
export async function captureImage(source: 'camera' | 'library', selectedFile?:File): Promise<CaptureResult | null> {
  const file = selectedFile ?? await pickFile('image/*', source === 'camera'); if (!file) return null;
  if (!(file.type.startsWith('image/')||(!file.type&&/\.(jpe?g|png|webp|heic|heif|avif)$/i.test(file.name)))||file.size>32*1024*1024)throw new UserInputError('Selecciona una foto de hasta 32 MB para prepararla.');
  try {
    const result = await readReceiptPhoto(file);
    if (result.image.base64.length > Math.ceil(4 * 1024 * 1024 / 3) * 4) throw new UserInputError('La imagen preparada supera 4 MB. Toma una foto más cercana al recibo, sin fondos innecesarios.');
    return result;
  } catch (error) {
    if (error instanceof UserInputError) throw error;
    if(!['image/jpeg','image/png'].includes(file.type))throw new UserInputError('Este navegador no pudo convertir esa foto. Prueba con una imagen JPG o PNG; los datos escritos se conservan.');
    const base64 = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result).split(',')[1]); reader.onerror = reject; reader.readAsDataURL(file); });
    if (file.size > 4 * 1024 * 1024) throw new UserInputError('No se pudo preparar esta foto para lectura local. Toma otra con buena luz o completa los datos manualmente.');
    return { image: { base64, mime: file.type as ImageData['mime'] }, text: '', warning: 'La lectura local no pudo completarse. La imagen no se envió a un servidor. Revisa la foto y completa los campos manualmente.' };
  }
}
export async function loadOCRFixture(): Promise<CaptureResult> { throw Error('El comprobante de prueba solo se utiliza en las pruebas nativas.'); }
