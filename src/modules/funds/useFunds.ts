import {useCallback,useEffect,useRef,useState} from 'react';
import {AppState} from 'react-native';
import {useIsFocused} from 'expo-router';
import {getMoneyStore} from '../money/localStore';
import {onDataCommitted} from '../../storage/changeEvents';
import {userMessage} from '../../core/errors';
import {FundsStore} from './store';
import type {FundData} from './types';
export function useFunds(){const focused=useIsFocused(),[data,setData]=useState<FundData|null>(null),[store,setStore]=useState<FundsStore|null>(null),[error,setError]=useState('');const mounted=useRef(true),epoch=useRef<symbol|null>(null);
 const reload=useCallback(async()=>{const ticket=Symbol();epoch.current=ticket;const s=new FundsStore(await getMoneyStore());const d=await s.snapshot();if(mounted.current&&ticket===epoch.current){setStore(s);setData(d);setError('');}},[]);
 useEffect(()=>{mounted.current=true;if(!focused)return;const refresh=()=>void reload().catch(e=>{if(mounted.current)setError(userMessage(e));});refresh();const stop=onDataCommitted(refresh),sub=AppState.addEventListener('change',state=>{if(state==='active')refresh();});return()=>{mounted.current=false;epoch.current=null;stop();sub.remove();};},[focused,reload]);
 return {data,store,error,reload};
}
