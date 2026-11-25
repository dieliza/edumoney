import {useLocalSearchParams} from 'expo-router';
import LedgerScreen from './LedgerScreen';
export default function MoneyScreen(){const params=useLocalSearchParams<{section?:string;month?:string;movementId?:string;history?:string}>();return <LedgerScreen key={`${params.section??''}:${params.month??''}:${params.movementId??''}:${params.history??''}`} initialMovementId={params.movementId} initialHistory={params.history} initialSection={params.section} initialMonth={params.month}/>;}
