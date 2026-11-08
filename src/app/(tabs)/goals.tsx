import { useState } from 'react';
import { View } from 'react-native';
import { ActionButton, Body, Card, IconBadge, ProgressBar, Screen, ui } from '../../ui/components';
import { goals } from '../../preview/data';
import { PreviewModal } from '../../preview/PreviewModal';
export default function Goals() {
  const [detail, setDetail] = useState<string | null>(null);
  return <Screen title="Mis metas" subtitle="Dale un propósito a cada paso que das.">
    {goals.map(goal => <Card key={goal.id}><View style={[ui.row, { alignItems: 'flex-start' }]}><IconBadge icon={goal.icon} tone={goal.tone} size={62} />
      <View style={{ flex: 1, gap: 11 }}><Body style={{ fontWeight: '700', fontSize: 18 }}>{goal.title}</Body><ProgressBar value={goal.percent} label={goal.title} />
        <View style={[ui.between, { flexWrap: 'wrap', gap: 6 }]}><Body muted style={{ fontSize: 13 }}><Body style={{ fontWeight: '700', fontSize: 13 }}>{goal.saved}</Body> / {goal.target}</Body><Body style={{ fontSize: 14, fontWeight: '700' }}>{goal.percent}%</Body></View>
      </View>
    </View></Card>)}
    <ActionButton title="Crear nueva meta" icon="add-circle-outline" onPress={() => setDetail('Crear nueva meta')} />
    <PreviewModal title={detail} close={() => setDetail(null)} />
  </Screen>;
}
