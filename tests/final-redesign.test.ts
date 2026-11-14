import {createElement} from 'react';
import {WheelPicker} from '../src/ui/WheelPicker.web';
import {renderToStaticMarkup} from 'react-dom/server';
import {expect,it,vi} from 'vitest';
import {wheelIndex,wheelKey,wheelWindow} from '../src/ui/wheelModel';
import {analysisMonths,expenseBreakdown,topExpenses,historicalSeries} from '../src/modules/money/analysisModel';
import type {Snapshot} from '../src/modules/money/types';
vi.mock('../src/ui/components',()=>({Body:({children}:{children:React.ReactNode})=>createElement('span',null,children)}));
vi.mock('../src/design/ThemeProvider',()=>({useTheme:()=>({colors:{line:'#ccc',surfaceAlt:'#fff',mint:'#eef',primary:'#070',muted:'#555'}})}));
it('ajusta al centro más cercano y limita extremos durante desplazamientos largos',()=>{
 expect(wheelIndex(72,5000)).toBe(2);expect(wheelIndex(-100,5000)).toBe(0);expect(wheelIndex(999999,5000)).toBe(4999);expect(wheelIndex(NaN,0)).toBe(0);
 expect(wheelWindow(2600,5000)).toEqual({start:2590,end:2611});
});
it('permite recorrer listas largas con flechas, páginas, Inicio y Fin',()=>{
 expect(wheelKey('ArrowUp',0,5000)).toBe(0);expect(wheelKey('ArrowDown',20,5000)).toBe(21);expect(wheelKey('PageDown',20,5000)).toBe(25);expect(wheelKey('End',20,5000)).toBe(4999);expect(wheelKey('Home',4999,5000)).toBe(0);
});
it('expone la selección accesible sin montar miles de categorías como botones',()=>{
 const options=Array.from({length:5000},(_,i)=>[String(i),`Categoría ${i}`] as const);
 const html=renderToStaticMarkup(createElement(WheelPicker,{label:'Categoría',value:'2600',options,onChange:()=>{}}));
 expect(html).toContain('role="listbox"');expect(html).toContain('aria-setsize="5000"');expect(html).toContain('aria-selected="true"');expect(html).toContain('Categoría 2600');expect(html.match(/role="option"/g)).toHaveLength(21);expect(html).not.toContain('<button');
});
it('conserva el aviso obligatorio cuando aún no se eligió categoría',()=>{
 const html=renderToStaticMarkup(createElement(WheelPicker,{label:'Categoría',value:'',options:[['','Seleccionar categoría'],['custom','Mascotas']],onChange:()=>{},required:true}));
 expect(html).toContain('aria-invalid="true"');expect(html).toContain('Selecciona una categoría.');expect(html).toContain('Mascotas');
});
it('ordena Top 3 y desglose sin perder categorías ni mutar los datos financieros',()=>{
 const items=[{id:'a',name:'Salud',spent:200},{id:'b',name:'Comida',spent:500},{id:'c',name:'Casa',spent:300},{id:'d',name:'Auto',spent:400},{id:'z',name:'Cero',spent:0}];
 expect(topExpenses(items).map(x=>x.id)).toEqual(['b','d','c']);expect(expenseBreakdown(items).map(x=>x.id)).toEqual(['b','d','c','a']);expect(items[0].id).toBe('a');
});
it('mantiene períodos cronológicos y distingue meses sin registros',()=>{
 expect(analysisMonths('2026-02',6)).toEqual(['2025-09','2025-10','2025-11','2025-12','2026-01','2026-02']);expect(()=>analysisMonths('2026-13',6)).toThrow();
 const snapshot:Snapshot={movements:[],categories:[],budgets:[],schedules:[],commitments:[]};
 const rows=historicalSeries(snapshot,'2026-11',6);expect(rows).toHaveLength(6);expect(rows.every(r=>r.income===0&&r.expenses===0&&!r.hasRecords)).toBe(true);
});
it('Cerrar sección web invoca el mismo bloqueo por recarga, sin cambiar de ruta',async()=>{
 const reload=vi.fn();vi.stubGlobal('window',{location:{reload}});
 try{const close=await import('../src/ui/closeSection.web');expect(close.canCloseSection).toBe(true);close.closeSection();expect(reload).toHaveBeenCalledOnce();}finally{vi.unstubAllGlobals();}
});
