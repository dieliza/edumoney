import {transactionFormColors as tc} from './transactionFormStyle';
import {useTheme} from '../design/ThemeProvider';
import {fixed} from '../design/tokens';
import {missingField} from './requiredFields';
export type SelectControlProps<T extends string=string>={label:string;value:T;options:readonly (readonly [T,string])[];onChange(value:T):void;required?:boolean;compact?:boolean;action?:boolean;presentation?:'transaction';optionTestIDs?:Readonly<Record<string,string|undefined>>};
/** Safari/iPad abre su selector flotante nativo, sin desplegar paneles dentro del documento. */
export function SelectControl<T extends string>({label,value,options,onChange,required=false,compact=false,action=false,optionTestIDs,presentation}:SelectControlProps<T>){
 const {colors}=useTheme(),transaction=presentation==='transaction';const missing=missingField(value,required),known=options.some(([id])=>id===value);
 return <label style={{display:'grid',gap:6,width:'100%',maxWidth:transaction?'100%':360,minWidth:0,flexShrink:1,alignSelf:'flex-start',background:'transparent'}}>
 {!compact&&!action?<span style={{font:transaction?'500 16px/22px system-ui':'600 14px/20px system-ui',color:transaction?tc.muted:fixed.ink,background:transaction?'transparent':'#E6F6F1',padding:transaction?0:'1px 4px',borderRadius:4,justifySelf:'start'}}>{label}</span>:null}
 <select aria-label={label} aria-required={required} aria-invalid={missing} value={action?'':known?value:''} disabled={!options.length} onChange={event=>{const next=event.currentTarget.value as T;if(action)event.currentTarget.value='';if(options.some(([id])=>id===next))onChange(next);}} style={{boxSizing:'border-box',width:'100%',maxWidth:'100%',minHeight:48,border:`${missing?2:1}px solid ${missing?fixed.expense:colors.line}`,borderRadius:12,padding:'10px 32px 10px 12px',font:transaction?'400 16px/24px system-ui':'600 16px/24px system-ui',color:action?fixed.white:fixed.ink,background:action?fixed.buttonEnd:transaction?tc.field:'#E6F6F1',colorScheme:'light',cursor:'pointer',touchAction:'manipulation'}}>
 {action||!known?<option key="placeholder" value="" disabled style={{color:action?fixed.white:fixed.ink,backgroundColor:action?fixed.buttonEnd:transaction?tc.field:'#E6F6F1'}}>{action?label:'Seleccionar'}</option>:null}
 {options.map(([id,text])=><option key={`value:${id}`} value={id} data-testid={optionTestIDs?.[id]} style={{color:fixed.ink,backgroundColor:transaction?tc.field:'#E6F6F1'}}>{text}</option>)}
 </select>
 {missing?<span role="alert" style={{font:'12px/18px system-ui',color:transaction?tc.error:fixed.expense}}>Obligatorio</span>:null}
 </label>;
}
