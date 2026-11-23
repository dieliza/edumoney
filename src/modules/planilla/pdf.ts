import { PDFDocument,StandardFonts } from 'pdf-lib';
import type { Closure } from './engine';
import { evaluateClosure } from './engine';
import { fields,SOURCES,VALIDATION,schedules,fieldStateLabels } from './catalog';
import { resolveForm4822025 } from './form482-resolve-2025';
import { decimal } from '../tax/domain';
import { appendOfficialForm482Draft, appendOfficialCTReference, HACIENDA_CT_2025_URL, markDraftPages } from './official-drafts';
const safe=(s:string)=>s.replace(/[\u2010-\u2015]/g,'-').replace(/[^\x20-\x7e\u00a0-\u00ff\n]/g,'?');
/** Plantilla informativa y guía de cálculos, con estados explícitos; no es una planilla radicada. */
export async function buildClosurePDF(c:Closure,result:ReturnType<typeof evaluateClosure>,template?:Uint8Array,ctTemplate?:Uint8Array,businessTemplate?:Uint8Array){
 const pdf=await PDFDocument.create(),font=await pdf.embedFont(StandardFonts.Helvetica),bold=await pdf.embedFont(StandardFonts.HelveticaBold);
 const transferNotes = template ? await appendOfficialForm482Draft(pdf,c,result,template,font,businessTemplate) : [];
 const draft = template ? resolveForm4822025(c) : null;
 if(template&&ctTemplate)await appendOfficialCTReference(pdf,c.year,ctTemplate,bold);
 let page=pdf.addPage([612,792]),y=748;
 function line(text:string,strong=false){const f=strong?bold:font;for(const paragraph of safe(text).split('\n')){let row='';for(const word of paragraph.split(' ')){if(f.widthOfTextAtSize(row+word+' ',10)>520){write(row);row='';}row+=word+' ';}write(row);}function write(row:string){if(y<55){page=pdf.addPage([612,792]);y=748;}page.drawText(row,{x:44,y,size:10,font:f});y-=15;}}
 line('Borrador de EduMoney - no radicado',true);line(result.mode==='laboratory'?'LABORATORIO - DATOS FICTICIOS. NO USAR PARA RENDIR.':'BORRADOR CON CALCULOS AUTOMATICOS Y CAMPOS PENDIENTES.',true);line(`Año: ${c.year}. Catálogo: ${result.catalogVersion??'Pendiente'}.`);
 if(draft){
  line('Formulario 482 oficial 2025: borrador para revisión. El PDF no radica ni certifica la planilla.',true);
  for(const note of transferNotes)line(note);
  if(ctTemplate)line(`El Anejo CT adjunto es una referencia sin completar. La línea 27C solo muestra el importe confirmado, no la estimación. Fuente: ${HACIENDA_CT_2025_URL}`);
  line(`Saldo del borrador: ${draft.balance===null?'pendiente':`${draft.balance.type==='payment'?'pago':draft.balance.type==='overpayment'?'sobrepago':'cero'} USD ${draft.balance.dollars}`}.`,true);
  if(draft.pending.length)line('Confirma antes de radicar: ' + draft.pending.map(item => item.line === 'scope' ? 'alcance' : item.line === 'grossFor17' ? 'base de la línea 17' : 'línea '+item.line).join(', ') + '.');
  line('Los campos no verificados permanecen en blanco. No hay envío a SURI. La firma, la cuenta bancaria y otros campos personales deben completarse fuera de EduMoney.');
  line(`Fuente: ${SOURCES.instructions.url}`);
 }else{
 line(template?'Formulario 482 informativo: traslados parciales; los campos no validados permanecen en blanco.':'Resumen de revisión: no incluye una plantilla oficial.');
 for(const note of transferNotes)line(note);
 if(template&&ctTemplate)line(`Anejo CT: referencia sin completar; no determina elegibilidad. Fuente: ${HACIENDA_CT_2025_URL}`);line('La revisión puede registrarla el usuario; no se exige un CPA para calcular. Los créditos, anejos y redondeos pendientes se identifican expresamente. No existe certificación de Hacienda ni envío a SURI.');
 for(const field of result.fields){const metadata=fields.find(f=>f.id===field.id)!;line(`${metadata.section}, línea ${field.id}: ${field.label}`,true);line(`Estado: ${fieldStateLabels[field.state]}. Valor en USD: ${field.state==='not_applicable'?'No aplica':decimal(field.valueCents)}. ${field.reason}`);line(`Referencia: ${metadata.reference}. Fórmula: ${metadata.formula}.`);line(`Evidencias: ${field.sourceIds.join(', ')||'Pendientes'}.`);}
 line(`Revisión registrada: ${result.userReview.confirmed?'Sí':'Pendiente'}. Revisor: ${result.userReview.name||'Sin indicar'}. ${result.userReview.notes}`);line(result.finalAmountCents===null?'Saldo pendiente: faltan componentes por introducir.':`Saldo calculado con los componentes declarados: ${result.balanceType==='refund'?'sobrepago':result.balanceType==='payment'?'pago':'cero'} USD ${decimal(Math.abs(result.finalAmountCents))}.`,true);line('Datos pendientes y situaciones fuera de alcance',true);for(const pending of [...result.missing,...result.excluded,...result.validationPending])line(pending);line('Anejos y límites',true);for(const schedule of schedules)line(`${schedule.id}: ${schedule.status}. ${schedule.reason}`);line(`Notas de cierre: ${c.notes||'Sin notas'}`);line(`Fuentes del catálogo ${VALIDATION.catalogVersion}`,true);for(const source of Object.values(SOURCES))line(`${source.year}, ${source.revision}: ${source.url}`);
 }
 markDraftPages(pdf,bold,result.mode==='laboratory');
 pdf.setTitle('Borrador de EduMoney — no radicado');pdf.setAuthor('EduMoney');return pdf.save();
}
