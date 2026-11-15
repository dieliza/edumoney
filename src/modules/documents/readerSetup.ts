import AsyncStorage from '@react-native-async-storage/async-storage';
import {notificationScope} from '../notifications/scope';
import {ReaderSetupPolicy} from './readerSetupPolicy';
const policy=new ReaderSetupPolicy(AsyncStorage,notificationScope);
export const prepareReceiptSetup=()=>policy.load();
export const markReceiptSetupSeen=()=>policy.markSeen();
export const resetReceiptSetup=()=>policy.reset();
/** Synchronous: camera input click must remain inside the original Safari gesture. */
export function allowReceiptCamera(){return true;}
