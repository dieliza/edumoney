import {expect,it,vi} from 'vitest';
import {NeonActionButton} from '../src/ui/NeonActionButton';
vi.mock('react-native',()=>({Pressable:()=>null,Text:()=>null,View:()=>null,useWindowDimensions:()=>({width:390})}));
vi.mock('expo-linear-gradient',()=>({LinearGradient:()=>null}));
vi.mock('react-native-svg',()=>({default:()=>null,Circle:()=>null,Defs:()=>null,Ellipse:()=>null,LinearGradient:()=>null,Path:()=>null,Rect:()=>null,Stop:()=>null}));
it('los botones de acción conservan la misma acción de pulsación, una vez por toque',()=>{for(const kind of ['income','expense','scan','debts','voice'] as const){const callback=vi.fn();const button=NeonActionButton({kind,title:kind,onPress:callback});expect(button.props.onPress).toBe(callback);button.props.onPress();expect(callback).toHaveBeenCalledOnce();}});
