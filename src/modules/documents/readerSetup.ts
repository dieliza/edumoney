import AsyncStorage from '@react-native-async-storage/async-storage';
import {router} from 'expo-router';
import {notificationScope} from '../notifications/scope';
import {readerReady} from './readerReady';
import {ReaderSetupPolicy} from './readerSetupPolicy';
const policy=new ReaderSetupPolicy(AsyncStorage,notificationScope);
export const prepareReceiptSetup=()=>policy.load();
export const markReceiptSetupSeen=()=>policy.markSeen();
export const resetReceiptSetup=()=>policy.reset();
/** Synchronous: camera input click must remain inside the original Safari gesture. */
export function allowReceiptCamera(){const configured=readerReady();if(configured)void policy.markSeen();return policy.allow(configured,()=>router.push({pathname:'/settings',params:{tab:'api',setup:'receipt'}}));}
