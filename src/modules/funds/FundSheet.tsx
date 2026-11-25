import type {PropsWithChildren} from 'react';
import {Text,type StyleProp,type TextStyle} from 'react-native';
import {useTheme} from '../../design/ThemeProvider';
import {transactionFormColors} from '../../ui/transactionFormStyle';
import {TransactionSheet,TransactionError} from '../money/TransactionFormUI';
export function FundSheet({title,close,busy=false,children}:PropsWithChildren<{title:string;close():void;busy?:boolean}>){return <TransactionSheet title={title} close={close} busy={busy}>{children}</TransactionSheet>;}
export function FundBody({children,muted=false,style}:PropsWithChildren<{muted?:boolean;style?:StyleProp<TextStyle>}>){const {name}=useTheme(),c=transactionFormColors(name);return <Text style={[{color:muted?c.muted:c.text,fontSize:16,lineHeight:24},style]}>{children}</Text>;}
export const FundError=TransactionError;
