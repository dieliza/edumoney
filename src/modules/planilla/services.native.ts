import { File,Directory,Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type { Closure } from './engine';
import { evaluateClosure } from './engine';
import { UserInputError } from '../../core/errors';
export async function generateClosurePDF(c:Closure,mode:'review'|'laboratory'='review'){
 const {Asset}=await import('expo-asset');
 async function localAsset(id:number) {
  const bundled=Asset.fromModule(id);
  if(/^https?:/.test(bundled.uri))throw new UserInputError('La plantilla oficial debe estar incluida en la aplicación para generar el PDF sin conexión.');
  const asset=new Asset({name:bundled.name,uri:bundled.uri,type:bundled.type});
  await asset.downloadAsync();
  if(!asset.localUri?.startsWith('file://'))throw new UserInputError('No se encontró la plantilla local.');
  return new File(asset.localUri).bytes();
 }
 const template=c.year===2025?await localAsset(require('../../../assets/tax/2025/form-482-informativo.pdf')):undefined;
 const ctTemplate=c.year===2025&&(c.guided?.respuestas.some(r=>r.clave==='creditos'&&r.valor===true)||!!c.components?.['27C'])
   ?await localAsset(require('../../../assets/tax/2025/schedule-ct-informativo.pdf')):undefined;
 const businessTemplate=c.year===2025&&c.draft482&&(c.draft482.incomeCoverage!=='salary'||c.components?.['27B']!=null)
  ?await localAsset(require('../../../assets/tax/2025/schedules-informativo.pdf')):undefined;
 const {buildClosurePDF}=await import('./pdf');return buildClosurePDF(c,evaluateClosure(c,mode),template,ctTemplate,businessTemplate);
}
export async function shareClosurePDF(c:Closure){if(!await Sharing.isAvailableAsync())throw new UserInputError('No hay diálogo de compartir disponible.');const dir=new Directory(Paths.cache,'edumoney-closure-export');dir.create({idempotent:true,intermediates:true});const f=new File(dir,`EduMoney-cierre-${c.year}-no-radicado.pdf`);try{f.write(await generateClosurePDF(c));await Sharing.shareAsync(f.uri,{mimeType:'application/pdf',UTI:'com.adobe.pdf',dialogTitle:'Compartir borrador de cierre, no radicado'});}finally{if(dir.exists)dir.delete();}}

export async function shareAnnualSummaryPDF(result: import('./annual-summary-pdf').AnnualSummary, kind: import('./annual-summary-pdf').AnnualSummaryKind) {
  if (!await Sharing.isAvailableAsync()) throw new UserInputError('No hay diálogo de compartir disponible.');
  const { buildAnnualSummaryPDF } = await import('./annual-summary-pdf');
  const dir = new Directory(Paths.cache, 'edumoney-annual-summary');
  dir.create({idempotent:true,intermediates:true});
  const f = new File(dir, `EduMoney-${kind === 'annual' ? 'informe-anual' : 'retenciones-creditos'}-${result.anio}.pdf`);
  try {
    f.write(await buildAnnualSummaryPDF(result, kind));
    await Sharing.shareAsync(f.uri, {mimeType:'application/pdf',UTI:'com.adobe.pdf',dialogTitle:'Compartir informe anual, no radicado'});
  } finally { if (f.exists) f.delete(); }
}
