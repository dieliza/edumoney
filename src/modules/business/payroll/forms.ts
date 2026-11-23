import { deductionLabels } from './domain';
import type { InputSpec } from '../obligations/RecordForm';
const answers=[['pending','Pendiente'],['yes','Sí'],['no','No']] as const;
const f=(key:string,label:string,money=false):InputSpec=>({key,label,money,nullable:true});
const r4 = 'https://hacienda.pr.gov/documentos/certificado-de-exencion-para-la-retencion-e-instrucciones-withholding-exemption-certificate-and-instructions-0';
const h = (field: InputSpec, explanation: string, example?: string, official = false, compactInteger = false): InputSpec => ({
 ...field, help: { text: example ? explanation + '\n\n' + example : explanation, ...(official ? { sourceLabel: 'Certificado e instrucciones de Hacienda', source: r4 } : {}) },
 ...(compactInteger ? { compactInteger: true } : {}),
});
const count = (key: string, label: string, explanation: string, example: string) => h(f(key,label),explanation,example,true,true);
export const employeeFields:InputSpec[]=[
 f('name','Nombre del empleado'),
 h(f('code','Código único del empleado'),'Identificador interno que eliges para distinguir a este empleado. No uses su número de Seguro Social.','Ejemplo: EMP-003.'),
 f('last4','Últimos 4 dígitos opcionales (nunca SSN completo)'),
 h({key:'frequency',label:'Frecuencia',options:[['weekly','Semanal'],['biweekly','Cada dos semanas'],['semimonthly','Quincenal'],['monthly','Mensual']]},'Indica cada cuánto se paga. Cada dos semanas son pagos cada 14 días; quincenal quiere decir dos pagos por mes.','Ejemplo: el 15 y el último día del mes es dos veces al mes.'),
 {key:'mode',label:'Remuneración',options:[['salary','Salario por período'],['hourly','Tarifa por hora']]},
 h(f('rateCents','Salario del período o tarifa por hora',true),'Antes de descuentos, escribe lo que se paga en cada período si tiene salario fijo, o lo que se paga por una hora si cobra por hora.','Ejemplo: $600 por período o $15 por hora.'),
 h(f('r4Date','Fecha del 499 R-4 firmado (AAAA-MM-DD)'),'El Certificado de Exención para la Retención (Formulario 499 R-4) es el documento que el empleado firma y entrega al patrono para informar qué tomar en cuenta al descontar la contribución de Puerto Rico de su salario. Usa la fecha al lado de la firma.','Ejemplo: 2026-08-15.',true),
 h({key:'personal',label:'Exención personal según 499 R-4',options:[['pending','Pendiente'],['none','Ninguna'],['individual','Individual: totalidad'],['joint','Conjunta: totalidad'],['half','Conjunta: mitad / opcional: totalidad']]},'Es la parte de la exención personal que el empleado pide tener en cuenta al calcular el descuento de contribución. Copia la opción marcada en la Parte A del certificado firmado.','Ejemplo: si dice contribuyente individual y marca completa, esa opción corresponde a Individual: totalidad.',true),
 h({key:'veteran',label:'Exención adicional de veterano',options:answers},'Es una exención adicional para la retención, separada de la exención personal principal. Usa lo indicado en la Parte A, línea 3, del certificado firmado.',undefined,true),
 count('dependents','Dependientes con exención completa (cantidad entera)','Un dependiente es alguien, como un hijo que cumple los requisitos, que el empleado puede incluir en su planilla. Con exención completa, se toma en cuenta el beneficio entero al calcular el descuento del sueldo. Cuenta solo las personas marcadas así en la Parte B del certificado firmado.','Ejemplo: si anotó dos con exención completa, escribe 2.'),
 count('halfDependents','Dependientes con mitad de exención (cantidad entera)','A veces, como en ciertos casos de custodia compartida, solo se toma en cuenta la mitad del beneficio por esa persona al calcular el descuento del sueldo. Cuenta las personas que figuran así en el certificado firmado. No las cuentes también en exención completa.','Ejemplo: una persona con mitad de exención se cuenta como 1, no como 0.5.'),
 count('allowances','Concesiones por deducciones (cantidad entera)','Algunos gastos que el empleado espera poder descontar en su planilla, como ciertos intereses de hipoteca, pueden hacer que le descuenten menos contribución de cada cheque. El formulario convierte esos gastos en un número. «Reclamar» significa pedir que se tome en cuenta ese número. Copia el que el empleado eligió en la Parte C, línea 3 del 499 R-4 firmado. No pongas una cantidad en dólares.','Ejemplo: si en esa línea anotó 2, escribe 2.'),
 h(f('extraCents','Retención PR adicional por período',true),'Es dinero adicional que el empleado autoriza descontar en cada pago, además de la retención regular. Este campo recibe dólares, no un porcentaje. Si el certificado indica un porcentaje, revisa el caso antes de anotarlo.','Ejemplo: si autorizó $10 adicionales por pago, escribe 10.00.',true),
 h({key:'ordinary',label:'Caso ordinario: todo el salario tributable, en Puerto Rico, sin retención federal de ingresos, bonos, propinas, exenciones especiales ni beneficios',options:answers},'Aquí significa que todo el salario tributa en Puerto Rico y no hay retención federal sobre ingresos, bonos, propinas, exenciones especiales ni beneficios. Si algo de eso aplica o no lo sabes, este cálculo automático no cubre el caso.', 'Ejemplo: un pago que incluye un bono necesita revisión aparte.'),
 f('note','Notas privadas del certificado / condiciones especiales'),
];
export const policyFields:InputSpec[]=[
 f('year','Año natural'),
 h({key:'fica',label:'FICA aplica a este empleo ordinario',options:answers},'FICA es el nombre de las contribuciones federales de Seguro Social y Medicare. Confirma si cubren este empleo.'),
 h({key:'sinot',label:'SINOT estatal aplica (planes privados: pendiente)',options:answers},'El SINOT es el seguro de Puerto Rico por incapacidad temporal no ocupacional. Revisa qué cubierta tiene el negocio antes de contestar.'),
 h(f('sinotEmployeeBps','Tasa SINOT del empleado (%)',true),'Es el porcentaje de SINOT que paga el empleado. Este campo admite hasta 0.30 y usa 0 solo si el patrono paga todo.','Ejemplo: una tasa documentada de 0.25% se escribe 0.25.'),
 h({key:'suta',label:'Desempleo de Puerto Rico aplica',options:answers},'Se refiere a la contribución patronal al seguro por desempleo de Puerto Rico. Confirma si cubre este empleo.'),
 h(f('sutaBps','Tasa de desempleo PR asignada (%)',true),'Copia el porcentaje vigente de la notificación del Departamento del Trabajo para este patrono. No uses la tasa de otro negocio.','Ejemplo: si la carta indica 2.30%, escribe 2.30.'),
 h({key:'futa',label:'FUTA aplica',options:answers},'FUTA es la contribución federal de desempleo del patrono. No se descuenta del salario del empleado.'),
 h(f('futaCreditBps','Crédito FUTA documentado (%)',true),'Es el porcentaje de crédito documentado para reducir la contribución federal de desempleo. El campo admite hasta 5.40.'),
 h(f('futaReductionBps','Reducción anual del crédito FUTA (%)',true),'Es cuánto se reduce el crédito federal para el año aplicable. No es la tasa FUTA del patrono. Escribe 0 solo si lo confirmaste.'),
 h({key:'cfse',label:'Prima CFSE aplica',options:answers},'La Corporación del Fondo del Seguro del Estado (CFSE) administra el seguro por accidentes o enfermedades del trabajo. Confirma qué cubierta tiene el patrono.'),
 h(f('cfseClass','Póliza y clasificación CFSE'),'Anota la póliza y la clasificación de trabajo que figuran en el documento del Fondo para estos salarios.'),
 h(f('cfseBps','Prima CFSE (%)',true),'Es la tasa del seguro del Fondo documentada para esta clasificación.','Ejemplo: $1 por cada $100 de salario equivale a 1.00%.'),
 f('validFrom','Vigencia desde AAAA-MM-DD'),
 f('validTo','Vigencia hasta AAAA-MM-DD'),
 h(f('source','Fuentes y cartas vigentes de tasas o cubierta'),'Anota el nombre y fecha de la carta, póliza o aviso que confirma la tasa.'),
 f('note','Supuestos y condiciones de las bases'),
];
export const runFields:InputSpec[]=[
 f('date','Fecha del pago AAAA-MM-DD'), f('start','Inicio del período AAAA-MM-DD'), f('end','Fin del período AAAA-MM-DD'),
 h(f('reference','Referencia única del cálculo'),'Usa una referencia que no se repita para encontrar este cálculo más adelante.','Ejemplo: PAGO-2026-08-15-01.'),
 h(f('hoursHundredths','Horas trabajadas (solo si cobra por hora)',true),'Escribe las horas de este período con hasta dos decimales.','Ejemplo: 7 horas y 30 minutos son 7.50 horas.'),
 h(f('priorWagesCents','Salarios previos de este patrono en el año',true),'Anota lo pagado por este patrono antes de empezar a registrar nómina aquí este año. No vuelvas a añadir los pagos guardados en EduMoney. Usa 0 solo si lo confirmaste.'),
 f('priorSource','Evidencia del saldo previo'),
 h(f('otherCents','Otras deducciones autorizadas del empleado',true),'Son otros descuentos del sueldo autorizados para este pago. No repitas los descuentos contributivos que ya se registran por separado.'),
 f('note','Notas del período; horas extraordinarias o beneficios requieren cálculo documentado aparte'),
];
export const actualFields:InputSpec[]=[
 h(f('gross','Bruto efectivamente pagado',true),'Es el total del pago antes de cualquier descuento. Usa el comprobante real, no una estimación.'),
 h(f('ssWages','Base salarial de Seguro Social del pago',true),'Es la parte de este pago sobre la que se calculó el Seguro Social. No es lo que se descontó.'),
 h(f('medicareWages','Base salarial Medicare del pago',true),'Es la parte de este pago sobre la que se calculó Medicare. No es lo que se descontó.'),
 ...['pr','ss','medicare','additionalMedicare','sinot','other'].map(k=>h(f(k,`Realmente retenido ${deductionLabels[k as keyof typeof deductionLabels]}`,true),'Copia el descuento que aparece en el comprobante real para este concepto. Escribe 0 únicamente si confirmaste que no se descontó nada.')),
 h(f('net','Neto efectivamente pagado',true),'Es lo que recibió el empleado después de los descuentos.','Ejemplo: $500 antes de descuentos menos $40 descontados dejan $460 de pago neto.'),
 f('reference','Comprobante único del pago real'),
 f('note','Explicación de diferencias con el cálculo'),
];
export function numeric<T extends object>(v:T,keys:string[]):T{return {...v,...Object.fromEntries(keys.map(k=>{const value=(v as Record<string,unknown>)[k];return [k,value===null||value===''?null:Number(value)];}))};}
