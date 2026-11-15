import {expect,it,vi} from 'vitest';
import {isValidElement,type ReactElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {SelectControl} from '../src/ui/SelectControl.web';
vi.mock('../src/design/ThemeProvider',()=>({useTheme:()=>({name:'dark',colors:{line:'#CFDFE2',text:'#102F42',surfaceAlt:'#F3F7FA'}})}));
function select(root:ReactElement){return (root.props as {children:ReactElement[]}).children.find(child=>isValidElement(child)&&child.type==='select')! as ReactElement<{value:string;onChange(event:{currentTarget:{value:string}}):void;'aria-invalid':boolean}>;}
it('conserva la opción seleccionada y comunica exactamente el identificador elegido',()=>{
 const change=vi.fn();const root=SelectControl({label:'Categoría',value:'custom',options:[['custom','Mi categoría'],['other','Otra']],onChange:change});const node=select(root);expect(node.props.value).toBe('custom');const target={value:'other'};node.props.onChange({currentTarget:target});expect(change).toHaveBeenCalledExactlyOnceWith('other');expect(target.value).toBe('other');
});
it('ejecuta cada acción una vez y permite volver a elegir la misma sin otro panel',()=>{
 const run=vi.fn();const node=select(SelectControl({action:true,label:'Nueva transacción',value:'',options:[['income','Añadir ingreso']],onChange:run}));
 const target={value:'income'};node.props.onChange({currentTarget:target});expect(run).toHaveBeenCalledExactlyOnceWith('income');expect(target.value).toBe('');target.value='income';node.props.onChange({currentTarget:target});expect(run).toHaveBeenCalledTimes(2);expect(target.value).toBe('');
});
it('mantiene el aviso requerido e ignora identificadores que no pertenecen a las opciones',()=>{
 const change=vi.fn();const root=SelectControl({required:true,label:'Método',value:'',options:[['cash','Efectivo']],onChange:change});const node=select(root);expect(node.props['aria-invalid']).toBe(true);node.props.onChange({currentTarget:{value:'invalido'}});expect(change).not.toHaveBeenCalled();expect(renderToStaticMarkup(root)).toContain('Obligatorio');
});
it('usa el menú del navegador con etiquetas completas y no dibuja una lista de botones dentro del historial',()=>{
 const options=Array.from({length:300},(_,i)=>[String(i),`Categoría ficticia ${i}`] as const);const html=renderToStaticMarkup(SelectControl({label:'Elegir',value:'299',options,onChange:()=>{}}));expect(html).toContain('<select');expect(html.match(/<option\b/g)).toHaveLength(300);expect(html).toContain('selected=""');expect(html).toContain('Categoría ficticia 299');expect(html).not.toContain('<button');
});
