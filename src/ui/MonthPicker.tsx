import {MonthControl} from './MonthControl';
export function MonthPicker({value,onChange}:{value:string;onChange(value:string):void}){return <MonthControl value={value} onChange={onChange}/>;}
