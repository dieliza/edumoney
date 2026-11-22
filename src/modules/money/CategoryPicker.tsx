import {useTheme} from '../../design/ThemeProvider';
import {SelectControl} from '../../ui/SelectControl';
import {Pressable,Text,View} from 'react-native';
import {transactionFormColors} from '../../ui/transactionFormStyle';
import {TransactionError} from './TransactionFormUI';
import {announceSaved} from '../../ui/saveFeedback';
import {WheelPicker} from '../../ui/WheelPicker';
import {useState,useLayoutEffect,useRef} from 'react';
import {legacyCommercialCategory} from './accountScope';
import {entryCategories} from './entryContext';
import {categoryDisplayName} from './categoryLabels';
import {newId} from '../../core/id';
import {UserInputError,userMessage} from '../../core/errors';
import {ActionButton,Body} from '../../ui/components';
import {Field,ErrorNotice} from './fields';
import {getMoneyStore} from './localStore';
import type {Category} from './types';
export function CategoryPicker({categories,kind,value,onChange,required=false,onCreated,presentation}:{categories:Category[];kind:'income'|'expense';value:string;onChange(value:string,name?:string):void;required?:boolean;onCreated?(category:Category):void;presentation?:'transaction'}){
 const {name:themeName}=useTheme(),tc=transactionFormColors(themeName);
 const live=useRef(true);useLayoutEffect(()=>{live.current=true;return()=>{live.current=false;};},[]);
 const [extra,setExtra]=useState<Category[]>([]),[adding,setAdding]=useState(false),[name,setName]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const merged=[...categories,...extra.filter(c=>!categories.some(old=>old.id===c.id))];
 const transaction=presentation==='transaction';
 const displayValue=!transaction&&merged.some(c=>c.id===value&&legacyCommercialCategory(c))?'':value;
 const list=entryCategories(merged,kind,value).filter(c=>transaction||!legacyCommercialCategory(c));
 async function create(){if(busy)return;setBusy(true);setError('');try{if(name.trim().toLocaleLowerCase('es')==='comercial')throw new UserInputError('Elige una categoría que describa la transacción.');const id=newId();const store=await getMoneyStore();await store.saveCategory(id,name,kind);announceSaved();const created={id,name:name.trim(),kind,archived:false};onCreated?.(created);if(!live.current)return;setExtra(old=>[...old,created]);onChange(id,name.trim());setAdding(false);setName('');}catch(e){if(live.current)setError(userMessage(e));}finally{if(live.current)setBusy(false);}}
 if(transaction)return <View style={{gap:0}}><SelectControl presentation="transaction" required={required} label="Categoría" value={displayValue} options={[[ '', 'Seleccionar categoría'],...list.map(c=>[c.id,c.archived?`${categoryDisplayName(c.name)} (archivada)`:categoryDisplayName(c.name)] as const)]} onChange={id=>onChange(id,list.find(c=>c.id===id)?.name)}/><Pressable accessibilityRole="button" accessibilityLabel={adding?'Cancelar creación de categoría':'Crear categoría'} disabled={busy} onPress={()=>setAdding(!adding)} style={{alignSelf:'flex-end',minHeight:44,justifyContent:'center'}}><Text style={{color:tc.link,fontSize:15,fontWeight:'600'}}>{adding?'Cancelar':'+ Crear categoría'}</Text></Pressable>{adding?<View style={{gap:12,padding:12,borderRadius:12,backgroundColor:tc.panel}}><Field presentation="transaction" label="Nombre de categoría" value={name} onChangeText={setName}/>{busy?<Text style={{color:tc.muted}}>Creando categoría…</Text>:<ActionButton title="Crear y seleccionar" onPress={()=>void create()}/>}<TransactionError message={error}/></View>:null}</View>;
 return <><WheelPicker key={kind} required={required} label={kind==='income'?'Categoría de ingreso':'Categoría de gasto'} value={displayValue} options={[[ '', 'Seleccionar categoría'],...list.map(c=>[c.id,c.archived?`${categoryDisplayName(c.name)} (archivada)`:categoryDisplayName(c.name)] as const)]} onChange={id=>onChange(id,list.find(c=>c.id===id)?.name)}/><ActionButton title={adding?'Cancelar nueva categoría':'+ Añadir categoría'} secondary onPress={()=>setAdding(!adding)}/>{adding?<><Field label="Nombre de categoría" value={name} onChangeText={setName}/>{busy?<Body>Guardando categoría…</Body>:<ActionButton title="Guardar y elegir categoría" onPress={()=>void create()}/>}</>:null}<ErrorNotice message={error}/></>;
}
