import { proposeFields } from './domain';
import { createWorker, PSM, type Page } from 'tesseract.js';
import { receiptContrast, chooseReceiptReading, receiptRows } from './receiptImage';
export async function readReceiptPhoto(file: File) {
  const bitmap = await createImageBitmap(file); const naturalWidth = bitmap.width, naturalHeight = bitmap.height;
  const scale = Math.min(2400 / Math.max(naturalWidth, naturalHeight), Math.max(1, 1000 / Math.max(naturalWidth, naturalHeight)));
  const canvas = document.createElement('canvas'); canvas.width = Math.max(1, Math.round(naturalWidth * scale)); canvas.height = Math.max(1, Math.round(naturalHeight * scale));
  const context = canvas.getContext('2d', { willReadFrequently: true }); if (!context) { bitmap.close(); throw Error('El navegador no puede preparar esta foto.'); }
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height); bitmap.close();
  const original = canvas.toDataURL('image/jpeg', .94);
  const quality = receiptContrast(context.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height);
  const improved = document.createElement('canvas'); improved.width = canvas.width; improved.height = canvas.height;
  improved.getContext('2d')!.putImageData(new ImageData(quality.pixels, canvas.width, canvas.height), 0, 0);
  let warning = naturalWidth < 600 || naturalHeight < 600 ? 'La foto tiene poca resolución. Acerca el recibo y toma otra foto si las cifras no se ven claras. ' : '';
  if (quality.brightness < 70) warning += 'La foto está oscura; usa más luz sin reflejos. ';
  let text = '';let needsAmountReview=false;
  const root = location.origin;
  const worker = await createWorker('spa+eng', 1, { workerPath: `${root}/ocr/worker.min.js`, corePath: `${root}/ocr/tesseract-core-lstm.js`, langPath: `${root}/ocr`, workerBlobURL: false, cacheMethod: 'none', gzip: true });
  try {
    await worker.setParameters({ tessedit_pageseg_mode: PSM.AUTO, preserve_interword_spaces: '1', user_defined_dpi: '300' });
    const structured = (data: Page) => receiptRows((data.blocks ?? []).flatMap(b => b.paragraphs.flatMap(p => p.lines.map(l => ({ text: l.text, x: l.bbox.x0, y: (l.bbox.y0 + l.bbox.y1) / 2, height: l.bbox.y1 - l.bbox.y0, confidence: l.confidence }))))) || data.text;
    const first = (await worker.recognize(canvas, { rotateAuto: true }, { text: true, blocks: true })).data;
    text = structured(first); let confidence = first.confidence;const readings=[{text,confidence}];
    if (confidence < 85 || !/\btotal\b/i.test(text)) {
      const second = (await worker.recognize(improved, { rotateAuto: true }, { text: true, blocks: true })).data; const next = structured(second);
      readings.push({text:next,confidence:second.confidence});
    }
    const selected=chooseReceiptReading(readings,readings.map(r=>proposeFields(r.text).amount));text=selected.text;confidence=selected.confidence;needsAmountReview=selected.needsAmountReview;
    if(needsAmountReview)warning+='Las dos lecturas proponen totales diferentes. El importe quedará vacío para que lo confirmes contra la foto. ';
    if (confidence < 75) warning += 'El reconocimiento tiene confianza limitada; verifica especialmente fechas, decimales e importes. ';
  } finally { await worker.terminate(); canvas.width = canvas.height = improved.width = improved.height = 1; }
  return { needsAmountReview, image: { mime: 'image/jpeg' as const, base64: original.split(',')[1] }, text: text.slice(0, 20000), warning: warning + 'Lectura procesada en este dispositivo. Confirma comercio, fecha, total y si ya está pagado; no se suman partidas automáticamente.' };
}
