import {View,useWindowDimensions} from 'react-native';
import {Screen} from '../../ui/components';
import {LearningSection} from './LearningSection';
export function LearnHub(){const{width}=useWindowDimensions();return <Screen title="Aprende" demo={false} subtitle="Un poco de conocimiento, más confianza para decidir."><View testID="learn-topic-columns" style={{flexDirection:width>=900?'row':'column',gap:16,alignItems:'stretch'}}><View testID="learn-financial-column" style={{flex:1,minWidth:0}}><LearningSection embedded tipsOnly/></View><View testID="learn-debt-column" style={{flex:1,minWidth:0}}><LearningSection debtOnly embedded/><LearningSection embedded lessonsOnly/></View></View></Screen>;}
