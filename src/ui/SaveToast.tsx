import {useSyncExternalStore} from 'react';
import {Text,View} from 'react-native';
import {getSaveNotice,serverSaveNotice,subscribeSaveNotice} from './saveFeedback';
export function SaveToast({inSheet=false}:{inSheet?:boolean}){const notice=useSyncExternalStore(subscribeSaveNotice,getSaveNotice,serverSaveNotice);return notice?<View pointerEvents="none" style={{position:'absolute',bottom:inSheet?16:100,left:16,right:16,alignItems:'center',zIndex:10000}}><View accessibilityRole="status" accessibilityLiveRegion="polite" style={{paddingVertical:12,paddingHorizontal:18,borderRadius:12,backgroundColor:'#EDF5FF',borderWidth:1,borderColor:'#76A7EF',maxWidth:600}}><Text style={{color:'#1359B5',fontSize:17,fontWeight:'800'}}>✓ {notice.text}</Text></View></View>:null;}
