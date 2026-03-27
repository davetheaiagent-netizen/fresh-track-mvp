import { Stack } from 'expo-router';
import { PaperProvider, MD3LightTheme } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';

const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#22C55E',
    secondary: '#3B82F6',
    tertiary: '#F59E0B',
    error: '#EF4444',
    background: '#F9FAFB',
    surface: '#FFFFFF',
  },
};

export default function RootLayout() {
  return (
    <PaperProvider theme={theme}>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen 
          name="item/[id]" 
          options={{ 
            headerShown: true,
            title: 'Item Details',
            presentation: 'card',
          }} 
        />
        <Stack.Screen 
          name="recipe/[name]" 
          options={{ 
            headerShown: true,
            title: 'Recipe',
            presentation: 'card',
          }} 
        />
        <Stack.Screen 
          name="notifications" 
          options={{ 
            headerShown: true,
            title: 'Notifications',
            presentation: 'card',
          }} 
        />
        <Stack.Screen 
          name="auth" 
          options={{ 
            headerShown: false,
            presentation: 'fullScreenModal',
          }} 
        />
      </Stack>
    </PaperProvider>
  );
}
