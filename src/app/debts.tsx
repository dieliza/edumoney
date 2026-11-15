import {Redirect,useLocalSearchParams} from 'expo-router';
export default function DebtsRedirect(){const params=useLocalSearchParams();return <Redirect href={{pathname:'/(tabs)/my-debts',params}}/>;}
