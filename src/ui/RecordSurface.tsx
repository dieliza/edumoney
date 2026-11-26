import {type PropsWithChildren} from 'react';
import {View,type StyleProp,type ViewStyle} from 'react-native';
import {NativeSurfaceTheme,useTheme} from '../design/ThemeProvider';
export function RecordSurface({children,style}:PropsWithChildren<{style?:StyleProp<ViewStyle>}>){
 const {name,colors,preference}=useTheme();
 return <NativeSurfaceTheme><View style={[style,{backgroundColor:preference==='crash-boat'?colors.surface:'transparent',boxShadow:'none',borderRadius:0,borderWidth:0,borderBottomWidth:1,borderColor:name==='dark'?'rgba(210,240,232,.22)':colors.line,paddingHorizontal:0,paddingVertical:10,minHeight:48,flexDirection:'row',flexWrap:'wrap',alignItems:'center',columnGap:16,rowGap:6}]}>{children}</View></NativeSurfaceTheme>;
}
