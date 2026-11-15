import {useEffect,useSyncExternalStore} from 'react';
import {AppState,Pressable,Text,View} from 'react-native';
import {router} from 'expo-router';
import {onDataCommitted} from '../storage/changeEvents';
import {ensureAutomaticSync,synchronize} from '../web/sync';
import {AutoSyncController} from '../web/autoSyncController';
import {autoSyncSnapshot,subscribeAutoSync,updateAutoSync} from '../web/autoSyncStatus';
import {attachSyncExit} from './syncExit';
export function AutoSyncHost(){const status=useSyncExternalStore(subscribeAutoSync,autoSyncSnapshot,autoSyncSnapshot);
 useEffect(()=>{const controller=new AutoSyncController(ensureAutomaticSync,()=>synchronize({uploadOnly:true}),updateAutoSync);controller.schedule(500);const off=onDataCommitted(()=>controller.schedule());const sub=AppState.addEventListener('change',state=>{if(state==='active')controller.schedule(100);else void controller.flush();});const detach=attachSyncExit(()=>void controller.flush(),()=>controller.schedule(100));const retry=setInterval(()=>void controller.flush(),30000);return()=>{off();sub.remove();detach();clearInterval(retry);controller.stop();};},[]);
 if(!['error','conflict'].includes(status.state))return null;
 return <View accessibilityLiveRegion="polite" style={{paddingVertical:8,paddingHorizontal:14,backgroundColor:'#FFF0C8'}}><Pressable accessibilityRole="button" accessibilityLabel="Revisar respaldo y sincronización" onPress={()=>router.push('/sync')} style={{minHeight:44,justifyContent:'center'}}><Text style={{fontSize:13,color:'#503900'}}>{status.message}</Text></Pressable></View>;
}
