import {type PropsWithChildren} from 'react';
import {View,type StyleProp,type ViewStyle} from 'react-native';
import {NativeChartTheme,useTheme} from '../design/ThemeProvider';
export function ChartSurface({children,style}:PropsWithChildren<{style?:StyleProp<ViewStyle>}>){
 const {preference,colors}=useTheme();
 return <NativeChartTheme><View style={[{padding:16,gap:14},style,{backgroundColor:preference==='crash-boat'?colors.surface:'transparent',borderWidth:0,boxShadow:'none'}]}>{children}</View></NativeChartTheme>;
}
