import { useState } from 'react';
import { newId } from '../../../core/id';
import { userMessage, UserInputError } from '../../../core/errors';
import { inputAmount } from '../../money/domain';
import { parseAmount } from '../../../core/money';
import { ActionButton,Body,Card,CloseButton } from '../../../ui/components';
import { Choices,ErrorNotice,Field } from '../../money/fields';
export interface InputSpec {key:string;label:string;money?:boolean;nullable?:boolean;required?:boolean;calculationRequired?:boolean;options?:readonly (readonly [string,string])[]}
/** Forms keep unknown monetary values null; calculations never populate actual payments. */
export function RecordForm<T extends object>({initial,fields,save,simulate,close}:{initial:T;fields:InputSpec[];save(value:T):Promise<void>;simulate?(value:T):string[];close():void}) {
 const [id]=useState(newId),[values,setValues]=useState<Record<string,string>>(()=>Object.fromEntries(fields.map(f=>{const v=(initial as Record<string,unknown>)[f.key];return [f.key,v==null?'':f.money?inputAmount(Number(v)):String(v)];}))),[error,setError]=useState(''),[result,setResult]=useState<string[]>([]),[busy,setBusy]=useState(false);
 function value(){return {...initial,id,...Object.fromEntries(fields.map(f=>[f.key,f.money?(values[f.key].trim()?parseAmount(values[f.key].trim()):null):f.nullable?(values[f.key]||null):values[f.key]]))} as T;}
 async function submit(){if(busy)return;setBusy(true);setError('');try{await save(value());close();}catch(e){setError(userMessage(e));}finally{setBusy(false);}}
 return <Card><Body>Deja en blanco los importes desconocidos. Escribe 0 únicamente cuando hayas confirmado cero. Guardar este registro no crea otro ingreso o gasto.</Body><ErrorNotice message={error}/>{fields.map(f=>f.options?<Choices key={f.key} label={f.label} value={values[f.key]} options={f.options} onChange={v=>{setValues({...values,[f.key]:v});setResult([]);}}/>:<Field key={f.key} testID={`record-${f.key}`} label={f.label} required={f.required} calculationRequired={f.calculationRequired ?? (f.key==='sinotEmployeeBps'?values.sinot==='yes':f.key==='sutaBps'?values.suta==='yes':f.key==='cfseBps'?values.cfse==='yes':['futaCreditBps','futaReductionBps'].includes(f.key)?values.futa==='yes':simulate?!!f.money:undefined)} value={values[f.key]} decimal={f.money} maxLength={2000} onChangeText={v=>{setValues({...values,[f.key]:v});setResult([]);}}/>)}
 {simulate?<ActionButton title="Simular con estos datos" secondary onPress={()=>{setError('');try{const missing=fields.filter(f=>(f.required||f.money||f.calculationRequired)&&!values[f.key].trim());if(missing.length)throw new UserInputError('Completa los cuadros rojos para calcular: '+missing.map(f=>f.label).join(', ')+'. Si el importe es cero, confírmalo escribiendo 0.');setResult(simulate(value()));}catch(e){setError(userMessage(e));}}}/>:null}{result.map((r,i)=><Body key={i}>{r}</Body>)}
 {!busy?<><ActionButton title="Guardar registro local" testID="record-save" onPress={()=>void submit()}/><CloseButton label="Cancelar registro" testID="record-cancel" onPress={close}/></>:<Body>Guardando…</Body>}
 </Card>;
}
