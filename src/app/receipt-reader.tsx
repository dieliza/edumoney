import {Redirect} from 'expo-router';
import {ActivityIndicator} from 'react-native';
import {useReaderOwner} from '../modules/documents/useReaderOwner';
import {Screen} from '../ui/components';
import {ReceiptReaderSettings} from '../modules/documents/ReceiptReaderSettings';
export default function ReceiptReaderSetup(){const {owner,loading}=useReaderOwner();if(loading)return <ActivityIndicator accessibilityLabel="Abriendo configuración"/>;return owner?<Screen back title="Administración del lector" demo={false}><ReceiptReaderSettings/></Screen>:<Redirect href="/"/>;}
