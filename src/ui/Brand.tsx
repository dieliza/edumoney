import { fixed } from '../design/tokens';
import { Image, Text, View, type ImageSourcePropType } from 'react-native';
import { useTheme } from '../design/ThemeProvider';
/** Incorporar aquí el archivo original aprobado, sin filtros ni deformación. */
const officialLogo: ImageSourcePropType | null = null;
export function Brand({ large = false, onDark = false }: { large?: boolean; onDark?: boolean }) {
  const { colors } = useTheme();
  if (officialLogo) return <Image source={officialLogo} resizeMode="contain" accessibilityLabel="EduMoney" style={{ width: large ? 240 : 112, height: large ? 180 : 56 }} />;
  return <View accessibilityLabel="EduMoney" accessible style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}>
    <Text style={{ fontSize: large ? 48 : 23, fontWeight: '800', letterSpacing: -1.5, color: onDark ? fixed.brandOnDark : colors.text }}>Edu</Text>
    <Text style={{ fontSize: large ? 48 : 23, fontWeight: '800', letterSpacing: -1.5, color: onDark ? fixed.brandAccentDark : colors.primary }}>Money</Text>
  </View>;
}
