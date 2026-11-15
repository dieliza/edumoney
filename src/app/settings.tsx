import {useLocalSearchParams} from 'expo-router';
import SettingsScreen from '../modules/settings/SettingsScreen';
export default function SettingsRoute(){const {tab,setup}=useLocalSearchParams<{tab?:string;setup?:string}>();return <SettingsScreen key={`${tab??''}:${setup??''}`}/>;}
