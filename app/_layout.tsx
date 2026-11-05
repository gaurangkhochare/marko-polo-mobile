import { Stack } from 'expo-router';
import 'react-native-reanimated';

import { AuthProvider } from '@/lib/auth';

export {
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  anchor: 'index',
};

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="(app)" />
      </Stack>
    </AuthProvider>
  );
}
