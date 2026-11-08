import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '../design/ThemeProvider';
import { StorageGate } from '../ui/StorageGate';
export default function RootLayout() {
  return <SafeAreaProvider><ThemeProvider><StorageGate>
    <Stack screenOptions={{ headerShown: false, animation: 'none' }} />
  </StorageGate></ThemeProvider></SafeAreaProvider>;
}
