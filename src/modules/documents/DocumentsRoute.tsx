import {Redirect,useLocalSearchParams} from 'expo-router';
import DocumentsScreen from './DocumentsScreen';
/** Keep existing notification links while separating dictations from scanning. */
export default function DocumentsRoute(){const {source,dictation}=useLocalSearchParams<{source?:string;dictation?:string}>();return source==='voice'?<Redirect href={{pathname:'/dictations',params:dictation?{dictation}:{}}}/>:<DocumentsScreen/>;}
