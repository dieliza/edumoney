import {Pressable,View} from 'react-native';
import {Body} from '../../ui/components';
/** Transparent, directly actionable task summary; the editor remains on this page. */
export function VoicePendingSummary({text,reasons,color,warning,disabled,onEdit}:{text:string;reasons:readonly string[];color:string;warning:string;disabled:boolean;onEdit():void}){
 return <Pressable accessibilityRole="button" accessibilityLabel={`Editar dictado pendiente: ${text}`} accessibilityHint="Abre el texto para corregirlo y guardar aquí mismo" disabled={disabled} onPress={onEdit} style={{gap:8,paddingVertical:8,minHeight:44}}><Body style={{color,fontWeight:'700',fontSize:19,lineHeight:27}}>{text}</Body><View style={{gap:4}}><Body style={{color:warning,fontWeight:'800'}}>Por corregir</Body>{reasons.length?reasons.map((reason,i)=><Body key={i} style={{color,lineHeight:25}}>• {reason}</Body>):<Body style={{color}}>Revisa el dictado y guárdalo para confirmar la transacción.</Body>}</View><Body style={{color:warning,fontWeight:'700'}}>Toca para editar</Body></Pressable>;
}
