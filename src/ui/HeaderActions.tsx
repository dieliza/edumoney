import {Pressable,View} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import {router,usePathname} from 'expo-router';
import {ThemePicker} from './ThemePicker';
import {NotificationBell} from './NotificationBell';
export function HeaderActions({color,month}:{color:string;month?:string}){const path=usePathname();return <View style={{width:88}}><View style={{flexDirection:'row'}}><ThemePicker compact color={color}/><NotificationBell color={color}/></View><Pressable testID="header-charts" accessibilityRole="button" accessibilityLabel="Gráficas y categorías" onPress={()=>{if(path!=='/charts')router.push(month?{pathname:'/charts',params:{month}}:'/charts');}} style={{width:44,height:44,alignItems:'center',justifyContent:'center'}}><Ionicons name="stats-chart-outline" size={23} color={color}/></Pressable></View>;}
