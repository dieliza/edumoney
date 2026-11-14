import {WheelPicker} from '../../ui/WheelPicker';
import {useState} from 'react';
import {newId} from '../../core/id';
import {userMessage} from '../../core/errors';
import {ActionButton,Body} from '../../ui/components';
import {Field,ErrorNotice} from './fields';
import {getMoneyStore} from './localStore';
import type {Category} from './types';
export function CategoryPicker({categories,kind,value,onChange,required=false}:{categories:Category[];kind:'income'|'expense';value:string;onChange(value:string,name?:string):void;required?:boolean}){
 const [extra,setExtra]=useState<Category[]>([]),[adding,setAdding]=useState(false),[name,setName]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const merged=[...categories,...extra.filter(c=>!categories.some(old=>old.id===c.id))];
 const list=merged.filter(c=>c.kind===kind&&(!c.archived||c.id===value));
 async function create(){if(busy)return;setBusy(true);setError('');try{const id=newId();const store=await getMoneyStore();await store.saveCategory(id,name,kind);setExtra(old=>[...old,{id,name:name.trim(),kind,archived:false}]);onChange(id,name.trim());setAdding(false);setName('');}catch(e){setError(userMessage(e));}finally{setBusy(false);}}
 return <><WheelPicker key={kind} required={required} label="Categoría" value={value} options={[[ '', 'Seleccionar categoría'],...list.map(c=>[c.id,c.archived?`${c.name} (archivada)`:c.name] as const)]} onChange={id=>onChange(id,list.find(c=>c.id===id)?.name)}/><ActionButton title={adding?'Cancelar nueva categoría':'+ Añadir categoría'} secondary onPress={()=>setAdding(!adding)}/>{adding?<><Field label="Nombre de categoría" value={name} onChangeText={setName}/>{busy?<Body>Guardando categoría…</Body>:<ActionButton title="Guardar y elegir categoría" onPress={()=>void create()}/>}</>:null}<ErrorNotice message={error}/></>;
}
