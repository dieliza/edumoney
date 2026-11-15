import {useCallback,useEffect,useState} from 'react';
import {ActivityIndicator,AppState} from 'react-native';
import {useIsFocused,useLocalSearchParams} from 'expo-router';
import {Screen} from '../../ui/components';
import {ErrorNotice} from '../money/fields';
import {VoiceDraftList} from './VoiceDraftList';
import {getDocumentStore} from './localStore';
import type {DocumentStore} from './store';
import type {DocumentsSnapshot} from './types';
export default function MyDictationsScreen(){
 const {dictation}=useLocalSearchParams<{dictation?:string}>(),focused=useIsFocused();
 const [content,setContent]=useState<{store:DocumentStore;data:DocumentsSnapshot}|null>(null),[error,setError]=useState('');
 const reload=useCallback(async()=>{const store=await getDocumentStore();const data=await store.snapshot();setContent({store,data});},[]);
 useEffect(()=>{if(!focused)return;let live=true;const refresh=()=>{void getDocumentStore().then(async store=>({store,data:await store.snapshot()})).then(value=>{if(live){setContent(value);setError('');}}).catch(()=>{if(live)setError('No pudimos cargar tus dictados. Vuelve a abrir esta sección.');});};refresh();const subscription=AppState.addEventListener('change',state=>{if(state==='active')refresh();});return()=>{live=false;subscription.remove();};},[focused]);
 return <Screen back title="Mis dictados" demo={false}><ErrorNotice message={error}/>{content?<VoiceDraftList initialId={dictation} store={content.store} data={content.data} reload={reload}/>:<ActivityIndicator accessibilityLabel="Cargando dictados"/>}</Screen>;
}
