import {Keyboard} from 'react-native';
import {fixed} from '../design/tokens';
/** Botón nativo del navegador: no envía formularios ni propaga el toque al selector. */
export function CloseButton({onPress,label='Cerrar ficha',testID}:{onPress():void;label?:string;testID?:string}){
 return <button type="button" aria-label={label} title={label} data-testid={testID} onPointerDown={event=>event.stopPropagation()} onClick={event=>{event.stopPropagation();Keyboard.dismiss();onPress();}} style={{width:48,height:48,minWidth:48,flexShrink:0,border:0,borderRadius:16,background:fixed.buttonStart,color:fixed.white,display:'flex',alignItems:'center',justifyContent:'center',alignSelf:'flex-end',position:'relative',zIndex:2,cursor:'pointer',touchAction:'manipulation',padding:0}}><span aria-hidden="true" style={{font:'32px/1 system-ui',pointerEvents:'none',userSelect:'none'}}>×</span></button>;
}
