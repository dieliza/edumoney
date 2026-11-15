import { Image, View } from 'react-native';

// Original supplied by the user. Preserve the entire image and its proportions.
const officialLogo = require('../../assets/edumoney-official-logo.png');

export function Brand({ large = false, size = 56 }: { large?: boolean; onDark?: boolean;size?:number }) {
  return <View style={{ width: large ? '100%' : size, maxWidth: large ? 240 : size, aspectRatio: 1 }}>
    <Image source={officialLogo} resizeMode="contain" accessibilityLabel="EduMoney" style={{ width: '100%', height: '100%' }} />
  </View>;
}
