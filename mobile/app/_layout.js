// app/_layout.js
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast, { BaseToast, ErrorToast } from 'react-native-toast-message';
import { ThemeProvider, useTheme } from '../src/context/ThemeContext';

const getToastConfig = (colors) => ({
  success: (props) => (
    <BaseToast
      {...props}
      style={{
        borderLeftColor: colors.accent,
        backgroundColor: colors.surfaceElevated,
        borderColor: colors.border,
        borderWidth: 1,
        borderRadius: 16,
        height: 64,
      }}
      contentContainerStyle={{ paddingHorizontal: 16 }}
      text1Style={{
        fontSize: 14,
        fontWeight: '700',
        color: colors.text,
      }}
      text2Style={{
        fontSize: 12,
        color: colors.textSecondary,
      }}
    />
  ),
  error: (props) => (
    <ErrorToast
      {...props}
      style={{
        borderLeftColor: colors.error,
        backgroundColor: colors.surfaceElevated,
        borderColor: colors.errorBorder,
        borderWidth: 1,
        borderRadius: 16,
        height: 64,
      }}
      contentContainerStyle={{ paddingHorizontal: 16 }}
      text1Style={{
        fontSize: 14,
        fontWeight: '700',
        color: colors.error,
      }}
      text2Style={{
        fontSize: 12,
        color: colors.textSecondary,
      }}
    />
  ),
  info: (props) => (
    <BaseToast
      {...props}
      style={{
        borderLeftColor: colors.accentLight,
        backgroundColor: colors.surfaceElevated,
        borderColor: colors.border,
        borderWidth: 1,
        borderRadius: 16,
        height: 64,
      }}
      contentContainerStyle={{ paddingHorizontal: 16 }}
      text1Style={{
        fontSize: 14,
        fontWeight: '700',
        color: colors.text,
      }}
      text2Style={{
        fontSize: 12,
        color: colors.textSecondary,
      }}
    />
  ),
});

function RootLayoutNav() {
  const { colors, isDark } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={colors.bg} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
          animation: 'fade',
        }}
      >
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="track/[id]"
          options={{
            presentation: 'modal',
            headerShown: false,
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="album/[id]"
          options={{
            presentation: 'modal',
            headerShown: false,
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="artist/[id]"
          options={{
            presentation: 'modal',
            headerShown: false,
            animation: 'slide_from_bottom',
          }}
        />
      </Stack>
      <Toast config={getToastConfig(colors)} />
    </View>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <RootLayoutNav />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
