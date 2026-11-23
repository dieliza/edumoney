import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import type { prepararExpedienteGuiado } from './annual-snapshot';
import { decimal } from '../tax/domain';

export type AnnualSummary = ReturnType<typeof prepararExpedienteGuiado>;
export type AnnualSummaryKind = 'annual' | 'withholding';

export async function buildAnnualSummaryPDF(result: AnnualSummary, kind: AnnualSummaryKind, synthetic = false) {
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const navy = rgb(.07,.15,.28), gray = rgb(.28,.34,.41), red = rgb(.60,.08,.09);
  const title = kind === 'annual' ? 'Informe anual de ingresos y gastos' : 'Resumen de retenciones y créditos';
  let page = pdf.addPage([612,792]), y = 720;
  const write = (input: string, strong = false) => {
    const font = strong ? bold : regular;
    const clean = input.replace(/[\u2010-\u2015]/g, '-').replace(/[^\x20-\x7e\u00a0-\u00ff]/g, '?');
    let row = '';
    const emit = () => {
      if (y < 62) { page = pdf.addPage([612,792]); y = 728; }
      page.drawText(row, { x: 48, y, size: 11, font, color: strong ? navy : gray }); y -= 17;
    };
    for (const word of clean.split(/\s+/)) for (const segment of word.match(/.{1,70}/g) ?? []) {
      if (font.widthOfTextAtSize(row + segment, 11) > 510) { emit(); row = ''; }
      row += segment + ' ';
    }
    if (row) emit();
  };
  page.drawText(title, { x:48, y:750, size:20, font:bold, color:navy });
  write(`Año contributivo ${result.anio} | ${result.movimientosConsiderados} movimientos considerados`,true);
  if (synthetic) write('DATOS FICTICIOS - SOLO PARA PRUEBA',true);
  write('Datos del libro, no una determinación contributiva. Los importes pueden estar incompletos.');
  const usd = (amount: number | null) => amount === null ? 'Pendiente' : 'USD ' + decimal(amount);
  y -= 13;
  if (kind === 'annual') {
    write(`Ingresos brutos documentados: ${usd(result.ingresosSinBruto && !result.totales.ingresosCentavos ? null : result.totales.ingresosCentavos)}${result.ingresosSinBruto && result.totales.ingresosCentavos ? ' (parcial)' : ''}`,true);
    write(`Gastos registrados (no necesariamente deducibles): ${usd(result.totales.gastosCentavos)}`);
    write(`Importe marcado para deducción por el usuario: ${usd(result.deduciblesConfirmadosCentavos)}`);
    write(`Diferencia preliminar, antes de retenciones: ${usd(result.netoPreliminarCentavos)}`);
    write(`Ingresos sin bruto: ${result.ingresosSinBruto}. Gastos sin revisar: ${result.gastosSinRevisar}.`);
  } else {
    write(`Retención registrada en el libro: ${usd(result.retencionesSinConfirmar && !result.totales.retencionesCentavos ? null : result.totales.retencionesCentavos)}${result.retencionesSinConfirmar && result.totales.retencionesCentavos ? ' (parcial)' : ''}`,true);
    write(`Ingresos con retención sin confirmar: ${result.retencionesSinConfirmar}.`);
    write('No se presume una retención de cero si falta el dato.');
    write('Créditos: confirmar elegibilidad y cantidad por separado; no se incluyen como retenciones.');
  }
  y -= 13;
  if (result.anejos.length) {
    write('Anejos a evaluar (no preparados por este informe)',true);
    for (const a of result.anejos) write(`${a.id}: ${a.motivo}`);
    y -= 10;
  }
  write('Revisión pendiente o notas', true);
  if (result.preguntasPendientes.length) write(`Preguntas pendientes: ${result.preguntasPendientes.length}.`);
  // Do not put bookkeeping identifiers or user notes in these detachable summaries.
  write(`Avisos del expediente: ${result.advertencias.length}. Revísalos dentro de EduMoney.`);
  write('Las informativas son evidencia para conciliar; no se suman otra vez a los ingresos del libro.');
  const pages = pdf.getPages();
  for (const [i,p] of pages.entries()) {
    p.drawLine({start:{x:48,y:48},end:{x:564,y:48},color:gray,opacity:.3,thickness:1});
    p.drawText('EduMoney | Borrador no radicado', { x:48,y:31,font:bold,size:9,color:red });
    p.drawText(`${i+1} / ${pages.length}`, {x:530,y:31,font:regular,size:9,color:gray});
  }
  pdf.setTitle(`${title} ${result.anio} - Borrador no radicado`);
  pdf.setAuthor('EduMoney');
  return pdf.save();
}
