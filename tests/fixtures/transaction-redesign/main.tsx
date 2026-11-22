import {useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {View,Text,Pressable} from 'react-native';
import {ThemeProvider,useTheme} from '../../../src/design/ThemeProvider';
import {MovementForm} from '../../../src/modules/money/MovementForm';
import {Screen,Body} from '../../../src/ui/components';
import {SelectControl} from '../../../src/ui/SelectControl';
import {getSaveNotice} from '../../../src/ui/saveFeedback';
import {setAccountScope} from '../../../src/modules/money/accountScope';
import type {LedgerMovement,EntryKind} from '../../../src/modules/money/types';
import {ledger,reviewSnapshot,setWriteDelay} from './store';
const first=await reviewSnapshot();
let show:(initial?:LedgerMovement,kind?:EntryKind)=>void=()=>{},refresh:()=>Promise<void>=async()=>{};
Object.assign(window,{edumoneyReview:{snapshot:reviewSnapshot,setWriteDelay,getSaveNotice,open:(initial?:LedgerMovement,kind?:EntryKind)=>show(initial,kind),setAccount:setAccountScope}});
function ThemeReviewControls(){const {name,setPreference}=useTheme();useEffect(()=>{Object.assign(window,{edumoneyThemeReview:{setPreference}});},[setPreference]);return <Text testID="review-theme" style={{color:'#fff'}}>{name}</Text>;}
function Review(){const [data,setData]=useState(first.all),[current,setCurrent]=useState<{initial?:LedgerMovement;kind:EntryKind}|null>({kind:'expense'}),[formKey,setFormKey]=useState(0),[notice,setNotice]=useState('');
 useEffect(()=>{refresh=async()=>{setData((await reviewSnapshot()).all);};show=(initial,kind='expense')=>{setCurrent({initial,kind});setFormKey(n=>n+1);};},[]);
 return <ThemeProvider><ThemeReviewControls/><Screen title="Revisión local" demo={false}><View style={{minHeight:'100%',padding:20,gap:12}}><Text style={{color:'#fff'}}>Revisión local · datos ficticios · sin conexión con producción</Text><Pressable accessibilityRole="button" onPress={()=>show()}><Text style={{color:'#fff'}}>Abrir formulario</Text></Pressable><SelectControl label="Control existente sin rediseño" value="one" options={[[ 'one','Sin cambios']]} onChange={()=>{}}/><View testID="review-canvas-text"><Body canvas>Texto sobre fondo de pantalla</Body></View><Text testID="review-notice" style={{color:'#fff'}}>{notice}</Text>{current?<MovementForm key={formKey} initial={current.initial} kind={current.kind} categories={data.categories} store={ledger} close={()=>setCurrent(null)} saved={async()=>{await refresh();setNotice('Guardado exitosamente');}} onHistoryEdit={movement=>show(movement,movement.kind as EntryKind)} historySaved={refresh}/>:null}</View></Screen></ThemeProvider>;
}
createRoot(document.getElementById('root')!).render(<Review/>);
