import {router} from 'expo-router';
import {MonthControl} from '../../ui/MonthControl';
import {useState} from 'react';
import {announceSaved} from '../../ui/saveFeedback';
import {ActionButton,Body} from '../../ui/components';
import {Choices,ErrorNotice,Field,Sheet} from '../money/fields';
import {getMoneyStore} from '../money/localStore';
import {localToday} from '../money/domain';
import {parseAmount} from '../../core/money';
import {userMessage} from '../../core/errors';
import type {MoneyStore} from '../money/store';
import type {Snapshot} from '../money/types';
export function useMonthlyBudget(){
 const [content,setContent]=useState<{store:MoneyStore;data:Snapshot}|null>(null),[error,setError]=useState('');
 async function open(){try{const store=await getMoneyStore();setContent({store,data:await store.snapshot(true)});setError('');}catch(e){setError(userMessage(e));}}
 return{open,editor:<>{error?<ErrorNotice message={error}/>:null}{content?<MonthlyBudgetEditor {...content} close={()=>setContent(null)}/>:null}</>};
}
export function MonthlyBudgetEditor({store,data,close}:{store:MoneyStore;data:Snapshot;close():void}){
 const [month,setMonth]=useState(localToday().slice(0,7));const active=data.categories.filter(c=>!c.archived&&c.kind==='expense');const [category,setCategory]=useState(active[0]?.id??'');
 const existing=(id:string,period=month)=>{const value=data.budgets.find(b=>b.month===period&&b.categoryId===id)?.amountCents;return value===undefined?'':`${BigInt(value)/100n}.${String(BigInt(value)%100n).padStart(2,'0')}`;};
 const [amount,setAmount]=useState(existing(category)),[busy,setBusy]=useState(false),[error,setError]=useState('');
 async function save(remove=false){if(busy)return;setBusy(true);try{await store.saveBudget(month,category,remove?null:parseAmount(amount.trim()));announceSaved();close();}catch(e){setError(userMessage(e));}finally{setBusy(false);}}
 function manage(){try{if(!category)throw new Error('Selecciona una categoría de gasto.');router.push({pathname:'/funds',params:{scope:'personal',kind:'budget',month,categoryId:category,categoryName:active.find(c=>c.id===category)?.name??'',target:String(amount?parseAmount(amount.trim()):0)}});}catch(e){setError(userMessage(e));}}
 return <Sheet title="Mi presupuesto mensual" close={close} busy={busy}><MonthControl value={month} onChange={value=>{setMonth(value);setAmount(existing(category,value));}}/><Choices label="Categoría de gasto" value={category} options={active.map(c=>[c.id,c.name] as const)} onChange={id=>{setCategory(id);setAmount(existing(id));}}/><Field label="Límite mensual (USD)" value={amount} onChangeText={setAmount} decimal/><Body muted>Un presupuesto es un plan: no reserva dinero automáticamente.</Body><ActionButton title="Administrar dinero reservado" secondary onPress={manage}/><Body muted>Cero es un límite explícito. Quitar el límite deja la categoría sin presupuesto; no elimina sus gastos.</Body><ErrorNotice message={error}/>{!busy?<><ActionButton title="Guardar presupuesto" onPress={()=>void save()}/><ActionButton title="Quitar límite de esta categoría" secondary onPress={()=>void save(true)}/></>:null}</Sheet>;
}
