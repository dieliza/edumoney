import type {PropsWithChildren} from 'react';
import {View} from 'react-native';
export const HeaderActions=()=>null;
export const Brand=()=>null;
export const useSafeAreaInsets=()=>({top:0,bottom:0,left:0,right:0});
export const useSafeAreaFrame=()=>({x:0,y:0,width:window.innerWidth,height:window.innerHeight});
export const SafeAreaProvider=({children}:PropsWithChildren)=><>{children}</>;
export const SafeAreaView=View;
export default function UnusedIcon(){return null;}
export const VoiceDraftList=()=>null;
export async function getDocumentStore(){throw Error('El lector de documentos no forma parte de esta revisión local.');}

export const StatusBar=()=>null;
