import {useState} from 'react';
import {View} from 'react-native';
import {Choices,Field} from '../modules/money/fields';
const names=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
export function monthLabel(value:string){return /^\d{4}-(0[1-9]|1[0-2])$/.test(value)?`${names[Number(value.slice(5))-1]} de ${value.slice(0,4)}`:value;}
export function MonthControl({value,onChange}:{value:string;onChange(value:string):void}){
 const [draft,setDraft]=useState<{basis:string;text:string}|null>(null);const year=draft?.basis===value?draft.text:value.slice(0,4);
 return <View style={{flexDirection:'row',gap:8}}><View style={{flex:2}}><Choices compact label="Mes" value={value.slice(5)} options={names.map((name,i)=>[String(i+1).padStart(2,'0'),name] as const)} onChange={month=>onChange(`${value.slice(0,4)}-${month}`)}/></View><View style={{flex:1}}><Field compact label="Año" value={year} maxLength={4} onChangeText={next=>{if(/^\d{0,4}$/.test(next)){setDraft({basis:value,text:next});if(/^\d{4}$/.test(next))onChange(`${next}-${value.slice(5)}`);}}}/></View></View>;
}
