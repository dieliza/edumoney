import { PDFDocument,StandardFonts,rgb,degrees } from 'pdf-lib';
import type { Closure } from './engine';
import { evaluateClosure } from './engine';
import { fields,SOURCES,VALIDATION,schedules,fieldStateLabels } from './catalog';
import { decimal } from '../tax/domain';
const safe=(s:string)=>s.replace(/[\u2010-\u2015]/g,'-').replace(/[^\x20-\x7e\u00a0-\u00ff\n]/g,'?');
/** Plantilla informativa y guía de cálculos, con estados explícitos; no es una planilla radicada. */
export async function buildClosurePDF(c:Closure,result:ReturnType<typeof evaluateClosure>,template?:Uint8Array){
 const pdf=await PDFDocument.create(),font=await pdf.embedFont(StandardFonts.Helvetica),bold=await pdf.embedFont(StandardFonts.HelveticaBold);
 if(template&&c.year===2025){const original=await PDFDocument.load(template);for(const p of await pdf.copyPages(original,[0,1,2]))pdf.addPage(p);const page=pdf.getPage(1);for(const [id,right] of [['1A',478],['1B',580]] as const){const value=result.fields.find(f=>f.id===id)?.valueCents;if(value!==null&&value!==undefined&&value%100===0){const text=String(value/100);page.drawText(text,{x:right-font.widthOfTextAtSize(text,8),y:672,size:8,font,color:rgb(0,0,0.6)});}}}
 let page=pdf.addPage([612,792]),y=748;
 function line(text:string,strong=false){const f=strong?bold:font;for(const paragraph of safe(text).split('\n')){let row='';for(const word of paragraph.split(' ')){if(f.widthOfTextAtSize(row+word+' ',10)>520){write(row);row='';}row+=word+' ';}write(row);}function write(row:string){if(y<55){page=pdf.addPage([612,792]);y=748;}page.drawText(row,{x:44,y,size:10,font:f});y-=15;}}
 line('Borrador de EduMoney - no radicado',true);line(result.mode==='laboratory'?'LABORATORIO - DATOS FICTICIOS. NO USAR PARA RENDIR.':'BORRADOR CON CALCULOS AUTOMATICOS Y CAMPOS PENDIENTES.',true);line(`Año: ${c.year}. Catálogo: ${result.catalogVersion??'Pendiente'}.`);line('La revisión puede registrarla el usuario; no se exige un CPA para calcular. Los créditos, anejos y redondeos pendientes se identifican expresamente. No existe certificación de Hacienda ni envío a SURI.');
 for(const field of result.fields){const metadata=fields.find(f=>f.id===field.id)!;line(`${metadata.section}, línea ${field.id}: ${field.label}`,true);line(`Estado: ${fieldStateLabels[field.state]}. Valor en USD: ${field.state==='not_applicable'?'No aplica':decimal(field.valueCents)}. ${field.reason}`);line(`Referencia: ${metadata.reference}. Fórmula: ${metadata.formula}.`);line(`Evidencias: ${field.sourceIds.join(', ')||'Pendientes'}.`);}
 line(`Revisión registrada: ${result.userReview.confirmed?'Sí':'Pendiente'}. Revisor: ${result.userReview.name||'Sin indicar'}. ${result.userReview.notes}`);line('Datos pendientes y situaciones fuera de alcance',true);for(const pending of [...result.missing,...result.excluded,...result.validationPending])line(pending);line('Anejos y límites',true);for(const schedule of schedules)line(`${schedule.id}: ${schedule.status}. ${schedule.reason}`);line(`Notas de cierre: ${c.notes||'Sin notas'}`);line(`Fuentes del catálogo ${VALIDATION.catalogVersion}`,true);for(const source of Object.values(SOURCES))line(`${source.year}, ${source.revision}: ${source.url}`);
 for(const p of pdf.getPages()){p.drawText('Borrador de EduMoney — no radicado',{x:42,y:25,size:10,font:bold,color:rgb(0.65,0,0)});if(result.mode==='laboratory')p.drawText('FICTICIO - NO RADICAR',{x:110,y:350,size:27,rotate:degrees(25),font:bold,color:rgb(0.8,0,0),opacity:0.25});}
 pdf.setTitle('Borrador de EduMoney — no radicado');pdf.setAuthor('EduMoney');return pdf.save();
}
