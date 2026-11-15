import {Pressable,View} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import {router,usePathname} from 'expo-router';
import {ThemePicker} from './ThemePicker';
import {NotificationBell} from './NotificationBell';
import {SideMenu} from './SideMenu';
export function HeaderActions({color,month,expanded=false}:{color:string;month?:string;expanded?:boolean}){const path=usePathname();return <View style={{width:expanded?'100%':176,flexDirection:'row',alignItems:'center',justifyContent:expanded?'space-between':'flex-end'}}><NotificationBell color={color}/><ThemePicker compact color={color}/><Pressable testID="header-charts" accessibilityRole="button" accessibilityLabel="Gráficas y categorías" onPress={()=>{if(path!=='/charts')router.push(month?{pathname:'/charts',params:{month}}:'/charts');}} style={{width:44,height:44,alignItems:'center',justifyContent:'center'}}><Ionicons name="stats-chart-outline" size={23} color={color}/></Pressable><SideMenu color={color}/></View>;}
