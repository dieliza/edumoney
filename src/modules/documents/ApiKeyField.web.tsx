import {useState,type CSSProperties} from 'react';
import {useTheme} from '../../design/ThemeProvider';
import {ActionButton,Body} from '../../ui/components';
export function ApiKeyField({value,onChange}:{value:string;onChange(value:string):void}){
 const {colors}=useTheme();const [visible,setVisible]=useState(false);
 const style:CSSProperties&{WebkitTextSecurity?:string}={boxSizing:'border-box',width:'100%',minHeight:52,borderRadius:12,border:`1px solid ${colors.line}`,padding:12,fontSize:17,color:colors.text,backgroundColor:colors.surfaceAlt,WebkitTextSecurity:visible?'none':'disc'};
 return <><Body>Clave de API de Anthropic</Body><input aria-label="Clave de API de Anthropic" name="edumoney-anthropic-api-key" data-testid="anthropic-key" type="text" autoComplete="off" autoCapitalize="none" autoCorrect="off" spellCheck={false} data-1p-ignore="true" data-lpignore="true" maxLength={256} placeholder="Pega aquí la clave que empieza por sk-ant-" value={value} onChange={event=>onChange(event.currentTarget.value)} style={style}/><ActionButton title={visible?'Ocultar clave de API':'Mostrar clave de API'} secondary onPress={()=>setVisible(!visible)}/></>;
}
