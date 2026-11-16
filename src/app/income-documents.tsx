import {useLocalSearchParams} from 'expo-router';
import IncomeDocumentsScreen from '../modules/income/IncomeDocumentsScreen';
export default function IncomeDocumentsRoute(){const {context}=useLocalSearchParams<{context?:string}>();return <IncomeDocumentsScreen key={context==='business'?'business':'personal'} business={context==='business'}/>;}
