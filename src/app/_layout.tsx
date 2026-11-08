import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from '../design/ThemeProvider';
import { BillsLifecycle } from '../modules/bills/BillsLifecycle';
import { StorageGate } from '../ui/StorageGate';

function ThemedNavigator() {
  const { name } = useTheme();
  return <Stack screenOptions={{ headerShown: false, animation: 'none', statusBarStyle: name === 'dark' ? 'light' : 'dark' }} />;
}
export default function RootLayout() {
  return <SafeAreaProvider><ThemeProvider><StorageGate>
    <BillsLifecycle><ThemedNavigator /></BillsLifecycle>
  </StorageGate></ThemeProvider></SafeAreaProvider>;
}
