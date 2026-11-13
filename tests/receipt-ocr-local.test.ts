import { expect, it } from 'vitest';
import { mkdtempSync, copyFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createWorker } from 'tesseract.js';
import { proposeFields } from '../src/modules/documents/domain';
import { receiptRows } from '../src/modules/documents/receiptImage';
it('lee una foto ficticia con modelos locales y relaciona el total con su etiqueta', async()=>{
 const path=mkdtempSync(join(tmpdir(),'edumoney-ocr-'));
 for(const language of ['eng','spa'])copyFileSync(`node_modules/@tesseract.js-data/${language}/4.0.0_best_int/${language}.traineddata.gz`,join(path,`${language}.traineddata.gz`));
 const worker=await createWorker('spa+eng',1,{langPath:path,cacheMethod:'none',gzip:true});
 try{const {data}=await worker.recognize(resolve('assets/tests/receipt.jpg'),{}, {text:true,blocks:true});const text=receiptRows((data.blocks??[]).flatMap(b=>b.paragraphs.flatMap(p=>p.lines.map(l=>({text:l.text,x:l.bbox.x0,y:(l.bbox.y0+l.bbox.y1)/2,height:l.bbox.y1-l.bbox.y0})))));expect(text||data.text).toMatch(/TOTAL/i);expect(proposeFields(text||data.text).amount).toBe('55.00');}finally{await worker.terminate();rmSync(path,{recursive:true,force:true});}
},45000);
