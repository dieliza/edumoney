import { View } from 'react-native';
import { Body } from './components';
import { useTheme } from '../design/ThemeProvider';
import { fixed } from '../design/tokens';
import type { DateFieldProps } from './DateField';
export function DateField({label,value,onChangeText,required=false,testID,max}:DateFieldProps){
 const {colors,name}=useTheme(); const missing=required&&!value;
 return <View style={{gap:6,padding:12}}><Body>{label}</Body><input type="date" aria-label={label} aria-required={required} aria-invalid={missing} data-testid={testID} value={value} max={max} onChange={e=>onChangeText(e.target.value)} style={{boxSizing:'border-box',width:'100%',minHeight:52,padding:12,borderRadius:12,border:`${missing?2:1}px solid ${missing?fixed.expense:colors.line}`,background:colors.surfaceAlt,color:colors.text,fontSize:17,colorScheme:name}}/>{missing?<Body style={{color:fixed.expense,fontSize:12}}>Obligatorio</Body>:null}</View>;
}
