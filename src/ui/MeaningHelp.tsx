import {useAccountScope} from '../modules/money/accountScope';
import {useState} from 'react';
import {Pressable,Text,View} from 'react-native';
import {usePathname} from 'expo-router';
import {useTheme} from '../design/ThemeProvider';
import {transactionFormColors} from './transactionFormStyle';
import {businessHelpExcluded,fieldMeaning,sectionMeaning} from './meaningCatalog';
export function MeaningHelp({label,explanation,canvas=false,inverse=false}:{label?:string;explanation?:string;canvas?:boolean;inverse?:boolean}){
 const [open,setOpen]=useState(false),{name}=useTheme(),path=usePathname(),account=useAccountScope(),c=transactionFormColors(name);
 const message=explanation??(label?fieldMeaning(label,path):undefined);
 if(!message||businessHelpExcluded(path)||(account==='business'&&/^\/(money|charts|documents|income-documents|dictations)$/.test(path)))return null;
 const ink=inverse?'#F6FFFC':canvas?(name==='dark'?'#F6FFFC':'#102F42'):c.text;
 return <View style={{gap:4,backgroundColor:'transparent',borderRadius:10,paddingHorizontal:0}}><Pressable testID={label?'meaning-'+label:'section-meaning'} accessibilityRole="button" accessibilityLabel={label?'¿Qué significa '+label+'?':'¿Qué significa?'} accessibilityState={{expanded:open}} onPress={()=>setOpen(v=>!v)} style={{minHeight:44,justifyContent:'center',alignSelf:'flex-start',maxWidth:'100%',flexShrink:1,borderRadius:10,backgroundColor:canvas?'transparent':c.panel,paddingHorizontal:canvas?4:12}}><Text style={{fontSize:14,fontWeight:'700',color:canvas?ink:c.link}}>¿Qué significa?</Text></Pressable>{open?<Text accessibilityLiveRegion="polite" style={{color:ink,fontSize:15,lineHeight:22,paddingBottom:8,paddingHorizontal:canvas?0:8,borderRadius:10,backgroundColor:canvas?'transparent':c.panel}}>{message}</Text>:null}</View>;
}
export function SectionMeaning({title}:{title:string}){
 const path=usePathname();
 return <MeaningHelp canvas explanation={sectionMeaning(path,title)}/>;
}
