import { Modal, View } from 'react-native';
import { useTheme } from '../design/ThemeProvider';
import { ActionButton, Body, Card, IconBadge } from '../ui/components';
export function PreviewModal({ title, close }: { title: string | null; close(): void }) {
  const { colors } = useTheme();
  return <Modal visible={title !== null} transparent animationType="none" onRequestClose={close}>
    <View style={{ flex: 1, backgroundColor: '#00000088', padding: 24, justifyContent: 'center' }}>
      <Card style={{ width: '100%', maxWidth: 480, alignSelf: 'center', gap: 20 }}>
        <IconBadge icon="sparkles-outline" />
        <Body style={{ fontSize: 23, fontWeight: '700' }}>{title}</Body>
        <Body>Estás explorando una demostración de EduMoney. Las cantidades son ficticias y no se guardarán movimientos.</Body>
        <View style={{ backgroundColor: colors.mint, padding: 14, borderRadius: 14 }}><Body style={{ fontSize: 14 }}>Por ahora puedes explorar las pantallas y elegir tu tema favorito.</Body></View>
        <ActionButton title="Seguir explorando" onPress={close} />
      </Card>
    </View>
  </Modal>;
}
