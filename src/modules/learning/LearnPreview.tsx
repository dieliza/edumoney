import { useState } from 'react';
import { Pressable, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../design/ThemeProvider';
import { ActionButton, Body, Card, IconBadge, Screen, ui } from '../../ui/components';
import { lessons } from '../../preview/data';
import { PreviewModal } from '../../preview/PreviewModal';
export default function Learn() {
  const { colors } = useTheme();
  const [detail, setDetail] = useState<string | null>(null);
  return <Screen title="Aprende" subtitle="Un poco de conocimiento, más confianza para decidir.">
    {lessons.map(lesson => <Pressable accessibilityRole="button" accessibilityLabel={lesson.title} key={lesson.title} onPress={() => setDetail(lesson.title)} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
      <Card style={{ backgroundColor: colors[lesson.tone] }}><View style={ui.row}><IconBadge icon={lesson.icon} tone={lesson.tone} size={54} />
        <View style={{ flex: 1, gap: 5 }}><Body style={{ fontWeight: '700', fontSize: 17 }}>{lesson.title}</Body><Body muted style={{ fontSize: 14, lineHeight: 21 }}>{lesson.description}</Body></View>
        <Ionicons name="chevron-forward" size={22} color={colors.muted} />
      </View></Card>
    </Pressable>)}
    <ActionButton title="Antes de decidir" icon="git-compare-outline" onPress={() => setDetail('Antes de decidir')} />
    <PreviewModal title={detail} close={() => setDetail(null)} />
  </Screen>;
}
