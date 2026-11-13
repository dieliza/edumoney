import {createWorker,PSM,type Page} from 'tesseract.js';
import {receiptContrast,receiptBands,type ReceiptFragment} from './receiptImage';
import {printedAmounts} from './printedAmounts';
import {financialRow,reconcilePhotoReadings,type PhotoReading} from './photoReadings';
/** Conserva un original legible y prueba contraste/filas sin enviar fotos a servidores. */
export async function readReceiptPhoto(file:File){
 const bitmap=await createImageBitmap(file),naturalWidth=bitmap.width,naturalHeight=bitmap.height;
 const scale=Math.min(2400/Math.max(naturalWidth,naturalHeight),Math.max(1,1000/Math.max(naturalWidth,naturalHeight)));
 const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(naturalWidth*scale));canvas.height=Math.max(1,Math.round(naturalHeight*scale));
 const context=canvas.getContext('2d',{willReadFrequently:true});if(!context){bitmap.close();throw Error('El navegador no puede preparar esta foto.');}context.drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();
 const original=canvas.toDataURL('image/jpeg',.94),quality=receiptContrast(context.getImageData(0,0,canvas.width,canvas.height).data,canvas.width,canvas.height);
 const improved=document.createElement('canvas');improved.width=canvas.width;improved.height=canvas.height;improved.getContext('2d')!.putImageData(new ImageData(quality.pixels,canvas.width,canvas.height),0,0);
 let warning=naturalWidth<600||naturalHeight<600?'La foto tiene poca resolución. Acerca el recibo y toma otra foto si las cifras no se ven claras. ':'';
 if(quality.brightness<70)warning+='La foto está oscura; usa más luz sin reflejos. ';
 let text='',needsAmountReview=false;const root=location.origin;
 const worker=await createWorker('spa+eng',1,{workerPath:`${root}/ocr/worker.min.js`,corePath:`${root}/ocr/tesseract-core-lstm.js`,langPath:`${root}/ocr`,workerBlobURL:false,cacheMethod:'none',gzip:true});
 const rowCanvas=document.createElement('canvas');
 try{
  await worker.setParameters({tessedit_pageseg_mode:PSM.AUTO,preserve_interword_spaces:'1',user_defined_dpi:'300'});
  const fragments=(data:Page):ReceiptFragment[]=>(data.blocks??[]).flatMap(b=>b.paragraphs.flatMap(p=>p.lines.map(l=>({text:l.text,x:l.bbox.x0,y:(l.bbox.y0+l.bbox.y1)/2,height:l.bbox.y1-l.bbox.y0,confidence:l.confidence}))));
  const reading=(data:Page):PhotoReading=>({rows:receiptBands(fragments(data)),confidence:data.confidence});
  // Mantener la misma corrección de inclinación en las dos pasadas para poder comparar filas.
  const first=(await worker.recognize(canvas,{rotateAuto:true}, {text:true,blocks:true})).data;
  const readings:PhotoReading[]=[reading(first)];let fallback=first.text;
  // Siempre repetir: la confianza global de palabras no demuestra que los números se hayan leído.
  try{await worker.setParameters({tessedit_pageseg_mode:PSM.SPARSE_TEXT});const second=(await worker.recognize(improved,{rotateRadians:first.rotateRadians??0}, {text:true,blocks:true})).data;readings.push(reading(second));fallback||=second.text;}catch{warning+='La segunda lectura no se completó; revisa los importes. ';}
  const bands=readings.flatMap(r=>r.rows).filter(r=>financialRow(r.text)&&(/TOTAL|GROSS|NET|BRUTO|NETO/i.test(r.text)||!printedAmounts(r.text).length||(r.confidence??0)<90));
  const targets:typeof bands=[];
  for(const row of bands.sort((a,b)=>Number(/TOTAL|GROSS|NET|BRUTO|NETO/i.test(b.text))-Number(/TOTAL|GROSS|NET|BRUTO|NETO/i.test(a.text))))if(!targets.some(t=>Math.abs(t.y-row.y)<Math.min(t.height,row.height)*.6))targets.push(row);
  await worker.setParameters({tessedit_pageseg_mode:PSM.SINGLE_LINE});
  // Las coordenadas inclinadas no se usan para recortar la foto sin rotar.
  for(const row of (Math.abs(first.rotateRadians??0)<.005?targets.slice(0,12):[])){
   const top=Math.max(0,Math.floor(row.y-row.height*.85)),bottom=Math.min(canvas.height,Math.ceil(row.y+row.height*.85));if(bottom<=top)continue;
   // Ampliar cada fila conserva puntos decimales y evita mezclar importes de filas vecinas.
   const factor=Math.min(2,3600/canvas.width);rowCanvas.width=Math.round(canvas.width*factor);rowCanvas.height=Math.max(1,Math.round((bottom-top)*factor));const ctx=rowCanvas.getContext('2d');if(!ctx)continue;ctx.fillStyle='#fff';ctx.fillRect(0,0,rowCanvas.width,rowCanvas.height);ctx.drawImage(canvas,0,top,canvas.width,bottom-top,0,0,rowCanvas.width,rowCanvas.height);
   try{const data=(await worker.recognize(rowCanvas,{}, {text:true})).data;if(data.text.trim()&&printedAmounts(data.text).length)readings.push({rows:[{text:data.text.trim(),y:row.y,height:row.height,confidence:data.confidence}],confidence:data.confidence});}catch{warning+='Una fila no pudo releerse; confirma sus cifras. ';break;}
  }
  const selected=reconcilePhotoReadings(readings);text=selected.text||fallback;needsAmountReview=selected.needsAmountReview;
  if(needsAmountReview)warning+='Las lecturas discrepan en cifras. Los importes afectados requieren revisión contra la foto; no se adivinan. ';
  if(!printedAmounts(text).length)warning+='Se reconocieron palabras pero no importes claros. Fotografía más cerca, con el papel plano y sin reflejos, o escribe los importes. ';
  if(selected.confidence<75)warning+='Verifica especialmente fechas, decimales e importes: la confianza de lectura es limitada. ';
 }finally{await worker.terminate();canvas.width=canvas.height=improved.width=improved.height=rowCanvas.width=rowCanvas.height=1;}
 return {needsAmountReview,image:{mime:'image/jpeg' as const,base64:original.split(',')[1]},text:text.slice(0,20000),warning:warning+'Lectura local de palabras y cifras. Confirma los datos y si el pago ya ocurrió; no se suman partidas automáticamente.'};
}
