import {router} from 'expo-router';
import {useState} from 'react';
import {ActionButton,Body,Card} from '../../ui/components';
import {FundEditor} from './FundEditor';
import {useFunds} from './useFunds';
import {simulate,type ScenarioInput} from '../decisions/domain';
import {formatMoney} from '../money/domain';
export function SimulationPlanCTA({input}:{input:ScenarioInput}){
 const [open,setOpen]=useState(false),[done,setDone]=useState(false),{store,data,reload,error}=useFunds();
 if(input.kind!=='saving'&&input.kind!=='emergency')return null;
 const result=simulate(input);
 return <Card><Body style={{fontWeight:'700'}}>¿Deseas convertir esta simulación en un plan de ahorro?</Body><Body>Proyectado: {formatMoney(result.total)}. Las cantidades de la simulación no son aportaciones realizadas.</Body>{done?<Body>Plan personal creado con $0.00 realizado. Confirma cada aportación cuando la hagas.</Body>:<ActionButton title="Sí, configurar mi plan" testID="simulation-to-plan" onPress={()=>setOpen(true)}/>}<ActionButton title="Ver mis fondos de ahorro" secondary onPress={()=>router.push({pathname:'/funds',params:{scope:'personal',kind:input.kind==='emergency'?'emergency':'savings'}})}/>{error?<Body>{error}</Body>:null}{open&&store&&data?<FundEditor scope="personal" kind={input.kind==='emergency'?'emergency':'savings'} plan={{target:result.total,contribution:input.contribution}} store={store} locations={data.locations} saved={async()=>{await reload();setDone(true);}} close={()=>setOpen(false)}/>:null}</Card>;
}
