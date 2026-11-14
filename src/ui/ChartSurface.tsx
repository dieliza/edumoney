import {type PropsWithChildren} from 'react';
import {View,type StyleProp,type ViewStyle} from 'react-native';
import {NativeChartTheme} from '../design/ThemeProvider';
export function ChartSurface({children,style}:PropsWithChildren<{style?:StyleProp<ViewStyle>}>){
 return <NativeChartTheme><View style={[{padding:16,gap:14},style,{backgroundColor:'transparent',borderWidth:0,boxShadow:'none'}]}>{children}</View></NativeChartTheme>;
}
