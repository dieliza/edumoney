import {useEffect,useMemo,useState} from 'react';
import {ActivityIndicator,Keyboard,KeyboardAvoidingView,Modal,Platform,Pressable,ScrollView,Text,TextInput,View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import {router,type Href} from 'expo-router';
import {useTheme} from '../../design/ThemeProvider';
import {useSheetViewport} from '../../ui/useSheetViewport';
import {transactionFormColors} from '../../ui/transactionFormStyle';
import {getMoneyStore} from '../money/localStore';
import {setAccountScope} from '../money/accountScope';
import {onDataCommitted} from '../../storage/changeEvents';
import {loadSearchItems} from './load';
import {searchItems,sectionItems,type SearchItem,type SearchTarget} from './model';
export function UniversalSearchButton({color}:{color:string}){
 const [open,setOpen]=useState(false);
 return <><Pressable testID="universal-search-open" accessibilityRole="button" accessibilityLabel="Buscar en EduMoney" onPress={()=>setOpen(true)} style={{width:44,height:44,alignItems:'center',justifyContent:'center'}}><Ionicons name="search-outline" size={24} color={color}/></Pressable>{open?<SearchWindow close={()=>setOpen(false)}/>:null}</>;
}
function SearchWindow({close}:{close():void}){
 const {name}=useTheme(),c=transactionFormColors(name),viewport=useSheetViewport();
 const [query,setQuery]=useState(''),[settled,setSettled]=useState(''),[items,setItems]=useState<SearchItem[]>(sectionItems),[selected,setSelected]=useState<SearchItem|null>(null),[busy,setBusy]=useState(true),[error,setError]=useState(''),[section,setSection]=useState('Todo'),[limit,setLimit]=useState(40),[retry,setRetry]=useState(0);
 useEffect(()=>{let active=true,epoch=0;const load=()=>{const ticket=++epoch;setBusy(true);void getMoneyStore().then(loadSearchItems).then(data=>{if(active&&ticket===epoch){setItems(data);setError('');}}).catch(()=>{if(active&&ticket===epoch)setError('No pudimos consultar tus registros. Intenta de nuevo.');}).finally(()=>{if(active&&ticket===epoch)setBusy(false);});};load();const unsubscribe=onDataCommitted(load);return()=>{active=false;epoch++;unsubscribe();};},[retry]);
 useEffect(()=>{const t=setTimeout(()=>{setSettled(query);setLimit(40);},180);return()=>clearTimeout(t);},[query]);
 const results=useMemo(()=>searchItems(settled.trim()?items:sectionItems,settled,section),[items,settled,section]);
 const sections=useMemo(()=>['Todo',...new Set(items.map(i=>i.section))],[items]);
 const ink={color:c.text,fontSize:16},button={minHeight:48,padding:12,borderRadius:12,borderWidth:1,borderColor:c.line,justifyContent:'center' as const};
 function go(target:SearchTarget){if(selected?.account)setAccountScope(selected.account);Keyboard.dismiss();close();router.push({pathname:target.path,params:target.params} as Href);}
 return <Modal visible transparent animationType="none" onRequestClose={close}><KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':undefined} enabled={Platform.OS!=='web'} style={[{flex:1,backgroundColor:'rgba(0,20,30,.5)'},Platform.OS==='web'&&viewport?{position:'absolute',top:viewport.top,height:viewport.height,left:0,right:0,flex:undefined}:undefined]}><SafeAreaView style={{flex:1}}><View accessibilityViewIsModal style={{flex:1,width:'100%',maxWidth:720,alignSelf:'center',padding:16,backgroundColor:c.background,gap:10}}>
 <View style={{flexDirection:'row',alignItems:'center',gap:8}}><Text accessibilityRole="header" style={[ink,{fontSize:23,fontWeight:'700',flex:1}]}>Buscar en EduMoney</Text><Pressable accessibilityRole="button" accessibilityLabel="Cerrar búsqueda" onPress={close} style={button}><Ionicons name="close" size={24} color={c.text}/></Pressable></View>
 <TextInput autoFocus testID="universal-search-query" accessibilityLabel="Palabra, fecha, categoría o importe" placeholder="Palabra, fecha, categoría o importe" placeholderTextColor={c.muted} value={query} onChangeText={v=>{setQuery(v);setSelected(null);}} returnKeyType="search" onSubmitEditing={()=>Keyboard.dismiss()} style={{minHeight:48,borderWidth:1,borderColor:c.line,borderRadius:12,padding:12,backgroundColor:c.field,color:c.fieldInk,fontSize:16}}/>
 {selected?<ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{gap:12}}><Pressable accessibilityRole="button" onPress={()=>setSelected(null)} style={button}><Text style={ink}>Volver a resultados</Text></Pressable><Text accessibilityRole="header" style={[ink,{fontWeight:'700',fontSize:20}]}>{selected.title}</Text><Text selectable style={ink}>{selected.detail}</Text>{selected.edit?<Pressable testID="search-edit-result" accessibilityRole="button" onPress={()=>go(selected.edit!)} style={button}><Text style={ink}>{selected.edit?.path==='/business-ledger'?'Revisar transacción comercial':'Editar esta transacción'}</Text></Pressable>:null}<Pressable accessibilityRole="button" onPress={()=>go(selected.target)} style={button}><Text style={ink}>Abrir {selected.section==='Secciones'?selected.title:selected.section}</Text></Pressable>{selected.category?<Pressable accessibilityRole="button" onPress={()=>{setQuery(selected.category!);setSection('Transacciones');setSelected(null);}} style={button}><Text style={ink}>Ver transacciones de {selected.category}</Text></Pressable>:null}</ScrollView>:<>
 <ScrollView horizontal keyboardShouldPersistTaps="handled" style={{flexGrow:0,maxHeight:50}} contentContainerStyle={{gap:8}}>{sections.map(s=><Pressable key={s} accessibilityRole="button" accessibilityState={{selected:s===section}} onPress={()=>{setSection(s);setLimit(40);}} style={[button,{backgroundColor:s===section?c.active:'transparent'}]}><Text style={[ink,{color:s===section?c.text:c.text}]}>{s}</Text></Pressable>)}</ScrollView>
 {busy?<ActivityIndicator accessibilityLabel="Buscando registros guardados"/>:null}{error?<View><Text accessibilityRole="alert" style={{color:c.error}}>{error}</Text><Pressable accessibilityRole="button" style={button} onPress={()=>setRetry(v=>v+1)}><Text style={ink}>Volver a intentar</Text></Pressable></View>:null}
 <Text accessibilityLiveRegion="polite" style={[ink,{fontSize:14}]}>{results.length} opciones</Text>
 <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={{gap:8,paddingBottom:20}}>{results.slice(0,limit).map(item=><Pressable key={item.id} accessibilityRole="button" accessibilityLabel={item.title+'. '+item.detail} onPress={()=>{Keyboard.dismiss();setSelected(item);}} style={button}><Text style={[ink,{fontWeight:'700'}]}>{item.title}</Text><Text style={{color:c.muted,fontSize:14,lineHeight:21}}>{item.detail}</Text></Pressable>)}{!busy&&!results.length?<Text style={ink}>No encontramos coincidencias. Prueba otra palabra, categoría o fecha (2026-11-25).</Text>:null}{results.length>limit?<Pressable accessibilityRole="button" style={button} onPress={()=>setLimit(v=>v+40)}><Text style={ink}>Mostrar más resultados</Text></Pressable>:null}</ScrollView></>}
 </View></SafeAreaView></KeyboardAvoidingView></Modal>;
}
