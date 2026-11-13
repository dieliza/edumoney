import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Body, CloseButton } from './components';
import { useTheme } from '../design/ThemeProvider';
import { fixed } from '../design/tokens';
import { validDate, localToday } from '../modules/money/domain';
export type DateFieldProps = {label:string;value:string;onChangeText(value:string):void;required?:boolean;testID?:string;max?:string};
export function DateField({label,value,onChangeText,required=false,testID,max}:DateFieldProps) {
  const {colors}=useTheme();const [open,setOpen]=useState(false);const [month,setMonth]=useState((validDate(value)?value:localToday()).slice(0,7));
  const [year,mm]=month.split('-').map(Number);const days=new Date(year,mm,0).getDate();const offset=new Date(year,mm-1,1).getDay();
  function move(delta:number){const d=new Date(year,mm-1+delta,1,12);setMonth(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`);}
  return <View style={{gap:8,padding:12}}><Body>{label}</Body><Pressable testID={testID} accessibilityRole="button" accessibilityLabel={`${label}: ${value||'Elegir fecha'}`} onPress={()=>setOpen(!open)} style={{padding:14,minHeight:50,borderRadius:12,borderWidth:required&&!value?2:1,borderColor:required&&!value?fixed.expense:colors.line,backgroundColor:colors.surfaceAlt}}><Body>📅 {value||'Elegir fecha'}</Body></Pressable>{required&&!value?<Body style={{color:fixed.expense}}>Obligatorio</Body>:null}
  {open?<View style={{gap:8,padding:8,backgroundColor:colors.surfaceAlt,borderRadius:12}}><View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}><Pressable accessibilityRole="button" accessibilityLabel="Mes anterior" onPress={()=>move(-1)} style={{padding:12,minHeight:48}}><Body>‹</Body></Pressable><Body>{month}</Body><Pressable accessibilityRole="button" accessibilityLabel="Mes siguiente" onPress={()=>move(1)} style={{padding:12,minHeight:48}}><Body>›</Body></Pressable></View><View style={{flexDirection:'row',flexWrap:'wrap'}}>{Array.from({length:offset+days},(_,i)=>{const day=i-offset+1;const date=`${month}-${String(day).padStart(2,'0')}`;return day<1?<View key={i} style={{width:'14.28%'}}/>:<Pressable key={i} accessibilityRole="button" accessibilityLabel={date} disabled={!!max&&date>max} onPress={()=>{onChangeText(date);setOpen(false);}} style={{width:'14.28%',minHeight:48,alignItems:'center',justifyContent:'center',opacity:max&&date>max?0.3:1,backgroundColor:value===date?colors.mint:undefined}}><Body>{day}</Body></Pressable>;})}</View><Pressable accessibilityRole="button" onPress={()=>{onChangeText('');setOpen(false);}} style={{padding:12,minHeight:48}}><Body>Limpiar fecha</Body></Pressable><CloseButton label="Cerrar calendario" onPress={()=>setOpen(false)}/></View>:null}</View>;
}
