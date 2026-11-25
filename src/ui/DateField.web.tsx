import {MeaningHelp} from './MeaningHelp';
import {transactionFormColors} from './transactionFormStyle';
import { View } from 'react-native';
import { Body } from './components';
import { useTheme } from '../design/ThemeProvider';
import { fixed } from '../design/tokens';
import type { DateFieldProps } from './DateField';
export function DateField({label,value,onChangeText,required=false,testID,max,presentation}:DateFieldProps){
 const {colors,name}=useTheme(),tc=transactionFormColors(name),transaction=presentation==='transaction'; const missing=required&&!value;
 return <View style={{gap:transaction?8:6,padding:transaction?0:12}}><Body style={transaction?{color:tc.muted,fontSize:16,fontWeight:'500'}:undefined}>{label}</Body><MeaningHelp label={label}/><input type="date" aria-label={label} aria-required={required} aria-invalid={missing} data-testid={testID} value={value} min="1900-01-01" max={max??'9999-12-31'} onChange={e=>onChangeText(e.target.value)} style={{boxSizing:'border-box',width:'100%',minHeight:52,padding:12,borderRadius:12,border:`${missing?2:1}px solid ${missing?fixed.expense:colors.line}`,background:transaction?tc.field:colors.surfaceAlt,color:transaction?tc.fieldInk:colors.text,fontSize:transaction?16:17,colorScheme:transaction?'light':name,...(transaction?{minWidth:0,maxWidth:'100%' as const}:{})}}/>{missing?<Body style={{color:transaction?tc.error:fixed.expense,fontSize:12}}>Obligatorio</Body>:null}</View>;
}
