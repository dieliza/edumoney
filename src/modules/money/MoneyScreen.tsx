import {useLocalSearchParams} from 'expo-router';
import LedgerScreen from './LedgerScreen';
export default function MoneyScreen(){const params=useLocalSearchParams<{section?:string;month?:string}>();return <LedgerScreen key={`${params.section??''}:${params.month??''}`} initialSection={params.section} initialMonth={params.month}/>;}
