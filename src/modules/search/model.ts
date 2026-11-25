export type SearchTarget={path:string;params?:Record<string,string>};
export type SearchItem={id:string;title:string;section:string;detail:string;words:string;date?:string;account?:'personal'|'business';target:SearchTarget;edit?:SearchTarget;category?:string};
export const normalizeSearch=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es').replace(/[$]/g,'').replace(/(\d),(?=\d{3})/g,'$1').replace(/\s+/g,' ').trim();
const months=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
export function dateWords(date:string){const m=/^(\d{4})-(\d{2})-(\d{2})/.exec(date);if(!m)return date;return date+' '+m[3]+'/'+m[2]+'/'+m[1]+' '+m[3]+'-'+m[2]+'-'+m[1]+' '+Number(m[3])+' de '+months[Number(m[2])-1]+' de '+m[1]+' '+m[2]+'/'+m[3]+'/'+m[1]+' '+m[2]+'/'+m[3]+'/'+m[1].slice(2);}
export function searchItems(items:SearchItem[],query:string,section='Todo'){
 const q=normalizeSearch(query),tokens=q.split(' ').filter(Boolean);const results=items.filter(i=>(section==='Todo'||i.section===section)&&(()=>{const text=normalizeSearch([i.title,i.section,i.detail,i.words,i.category,i.date?dateWords(i.date):''].join(' '));return tokens.every(t=>text.includes(t));})());
 return results.sort((a,b)=>Number(normalizeSearch(b.title)===q)-Number(normalizeSearch(a.title)===q)||(b.date??'').localeCompare(a.date??'')||a.title.localeCompare(b.title,'es'));
}
export const sectionItems:SearchItem[]=[
 ['Administrar fondos','/funds','ahorros fondo emergencia presupuestos reservados transferir transferencias internas'],
 ['Mi dinero','/money','inicio home personal comercial saldo ingresos gastos nueva transacción'],
 ['Transacciones','/charts','gráficas ingresos gastos mes tendencias'],
 ['Editar historiales','/money','editar borrar ingresos gastos historial'],
 ['Mis metas','/goals','ahorro presupuesto mensual fondo emergencia'],
 ['Aprende','/learn','lecciones educación premios'],
 ['Mi progreso','/progress','trofeos logros plan 90 días'],
 ['Mis deudas','/debts','tarjetas préstamos pagos cobros programados'],
 ['Antes de decidir','/decisions','simulador tasa nominal anual préstamo vehículo vivienda ahorro'],
 ['Facturas','/bills','vencimientos calendario pagos'],
 ['Recibos y documentos','/documents','escanear foto comprobante'],
 ['Cheques y talonarios','/income-documents','nómina salario ingreso bruto neto'],
 ['Mis dictados','/dictations','voz audio pendientes corregir'],
 ['Negocio','/business','DBA LLC comercial contable hacienda'],
 ['Transacciones de negocio','/business-ledger','recibos comercial ingresos gastos CPA'],
 ['Nómina','/business-payroll','empleados negocio salarios'],
 ['Configuración','/settings','tema apariencia seguridad contraseña ayuda'],
 ['Sincronización','/sync','dispositivos respaldo'],
 ['Respaldo','/backup','exportar restaurar copia'],
 ['Documentos y herramientas del negocio','/business-planning','comercial contable CPA planificación'],
 ['Obligaciones del negocio','/business-obligations','comercial contratistas IVU Hacienda']
].map(([title,path,words])=>({id:'section:'+path+title,title,section:'Secciones',detail:'Abrir '+title,words,target:{path,params:title==='Editar historiales'?{history:'expense'}:undefined}}));
