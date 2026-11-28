import {useState} from 'react';
import {ActionButton,Body} from '../../ui/components';
import {formatMoney} from '../money/domain';
import type {Debt} from './types';
export function DebtDeleteAction({debt,busy,remove}:{debt:Pick<Debt,'name'|'balanceCents'>;busy:boolean;remove():void}){
 const [confirm,setConfirm]=useState(false);
 if(busy)return null;
 return confirm?<><Body>¿Eliminar la deuda «{debt.name}» con saldo registrado de {formatMoney(debt.balanceCents)}? Se quitará de tus deudas y proyecciones. Esta acción no paga ni cancela la obligación con tu entidad.</Body><Body>Los pagos realizados y sus movimientos se conservan. Se anularán las facturas pendientes vinculadas. El balance disponible no cambia.</Body><ActionButton title="Confirmar eliminación de deuda" onPress={remove}/><ActionButton title="Cancelar eliminación" secondary onPress={()=>setConfirm(false)}/></>:<ActionButton title="Eliminar deuda" secondary onPress={()=>setConfirm(true)}/>;
}
