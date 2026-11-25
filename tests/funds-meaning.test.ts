import {isValidElement,type ReactElement} from 'react';
import {expect,it,vi} from 'vitest';
import {fieldMeaning,sectionMeaning} from '../src/ui/meaningCatalog';
import {MeaningHelp} from '../src/ui/MeaningHelp';
const h=vi.hoisted(()=>({open:false,theme:'light',path:'/funds',scope:'personal'}));
vi.mock('react',async original=>({...await original<typeof import('react')>(),useState:()=>[h.open,(update:(v:boolean)=>boolean)=>{h.open=update(h.open);}]}));
vi.mock('react-native',()=>({View:()=>null,Pressable:()=>null,Text:()=>null}));
vi.mock('expo-router',()=>({usePathname:()=>h.path}));
vi.mock('../src/design/ThemeProvider',()=>({useTheme:()=>({name:h.theme})}));
vi.mock('../src/modules/money/accountScope',()=>({useAccountScope:()=>h.scope}));
type Node=ReactElement<Record<string,unknown>>;
function nodes(x:unknown):Node[]{if(Array.isArray(x))return x.flatMap(nodes);if(!isValidElement(x))return[];const n=x as Node;return[n,...nodes(n.props.children)];}
it('explica todos los conceptos y campos nuevos sin confundir planes, reservas e ingresos',()=>{
 for(const label of ['Resumen de tu dinero','Balance disponible','Total de fondos','Ahorros','Fondo de emergencia','Presupuestos reservados','Transferir fondos','Historial de transferencias','Ahorro proyectado y realizado','Aportación periódica planificada (USD)','Frecuencia de aportación','Fecha objetivo (opcional)','Dónde guardas el dinero','Tipo de ubicación','Institución o nombre de ubicación','Nombre del fondo','Nombre de la meta','Presupuesto planificado (USD)','Origen','Destino','Cantidad (USD)','Fecha','Confirmación','Descripción (opcional)'])expect(fieldMeaning(label,'/funds'),label).toBeTruthy();
 expect(fieldMeaning('Total de fondos')).toContain('no este total');expect(fieldMeaning('Presupuestos reservados')).toContain('no registra un gasto');expect(fieldMeaning('Ahorro proyectado y realizado')).toContain('cero ahorro realizado');expect(fieldMeaning('Transferir fondos')).toContain('No es un ingreso ni un gasto');expect(fieldMeaning('Fecha objetivo (opcional)')).not.toContain('cantidad que quieres');expect(fieldMeaning('Cantidad (USD)','/money')).toBeUndefined();expect(fieldMeaning('Tasa nominal anual fija (%)')).toContain('Para 12 %, escribe 12');expect(sectionMeaning('/','Mi dinero')).toContain('Total de fondos');expect(sectionMeaning('/funds','Administrar fondos')).toContain('eliminar');expect(sectionMeaning('/business','Negocio')).toBeUndefined();
});
it('la ayuda se abre y cierra, conserva contraste en la tarjeta verde y respeta Negocio',()=>{
 for(const theme of ['light','dark']){h.theme=theme;h.path='/funds';h.scope='personal';h.open=false;const render=()=>nodes(MeaningHelp({label:'Total de fondos',canvas:true,inverse:true}));let t=render();expect(t.some(n=>n.props.accessibilityLiveRegion==='polite')).toBe(false);(t.find(n=>n.props.accessibilityRole==='button')!.props.onPress as ()=>void)();t=render();expect(t.find(n=>n.props.accessibilityLiveRegion==='polite')!.props.children).toContain('no este total');expect((t.find(n=>n.props.accessibilityLiveRegion==='polite')!.props.style as {color:string}).color).toBe('#F6FFFC');(t.find(n=>n.props.accessibilityRole==='button')!.props.onPress as ()=>void)();expect(render().some(n=>n.props.accessibilityLiveRegion==='polite')).toBe(false);}
 h.path='/business';expect(MeaningHelp({label:'Total de fondos'})).toBeNull();
});
