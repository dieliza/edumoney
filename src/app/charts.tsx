import {useLocalSearchParams} from 'expo-router';
import ChartsScreen from '../modules/money/ChartsScreen';
export default function ChartsRoute(){const {month,view}=useLocalSearchParams<{month?:string;view?:string}>();return <ChartsScreen key={`${month??''}:${view??''}`} initialMonth={month} initialView={view}/>;}
