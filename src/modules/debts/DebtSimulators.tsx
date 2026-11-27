import {router} from 'expo-router';
import {Pressable,View} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import {useTheme} from '../../design/ThemeProvider';
import {Body,Card} from '../../ui/components';
import type {Debt} from './types';
export function DebtSimulators(_props:{debts:Debt[];onOtherMovement():void}){
 const{colors}=useTheme();const items=[{title:'Préstamo · Auto · Vivienda',icon:'calculator-outline' as const,width:220,run:()=>router.push({pathname:'/decisions',params:{kind:'loan'}})},{title:'Facturas vinculadas',icon:'calendar-outline' as const,width:132,run:()=>router.push({pathname:'/bills',params:{scope:'debts'}})}];
 return <><Card row><Body style={{fontWeight:'700'}}>¿Para qué sirven los simuladores?</Body><Body>Explora escenarios de préstamo, auto y vivienda. Compara pagos, plazos e intereses antes de decidir; simular no realiza pagos ni modifica tus balances.</Body><Body muted>Para registrar pagos y actualizar el saldo, abre la deuda correspondiente. Las facturas vinculadas conservan sus funciones de registro.</Body></Card><View testID="debt-simulator-accesses" style={{flexDirection:'row',flexWrap:'wrap',gap:12}}>{items.map(item=><Pressable key={item.title} testID={item.width===220?'debt-combined-simulator':'debt-linked-bills'} accessibilityRole="button" accessibilityLabel={item.title} onPress={item.run} style={({pressed})=>({width:item.width,maxWidth:'100%',minHeight:126,padding:14,borderRadius:20,borderWidth:1,borderColor:colors.line,backgroundColor:colors.surface,alignItems:'center',justifyContent:'center',gap:10,opacity:pressed?0.7:1})}><View pointerEvents="none" style={{width:48,height:48,borderRadius:24,backgroundColor:colors.mint,alignItems:'center',justifyContent:'center'}}><Ionicons name={item.icon} size={26} color={colors.primary}/></View><Body style={{fontSize:14,lineHeight:19,fontWeight:'700',textAlign:'center'}}>{item.title}</Body></Pressable>)}</View></>;
}
