// app/_layout.js
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast, { BaseToast, ErrorToast } from 'react-native-toast-message';
import { COLORS } from '../src/constants/theme';

const toastConfig = {
  success: (props) => (
    <BaseToast
      {...props}
      style={{
        borderLeftColor: COLORS.purpleLight,
        backgroundColor: COLORS.surfaceElevated,
        borderColor: COLORS.border,
        borderWidth: 1,
        borderRadius: 16,
        height: 64,
      }}
      contentContainerStyle={{ paddingHorizontal: 16 }}
      text1Style={{
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.text,
      }}
      text2Style={{
        fontSize: 12,
        color: COLORS.textSecondary,
      }}
    />
  ),
  error: (props) => (
    <ErrorToast
      {...props}
      style={{
        borderLeftColor: COLORS.error,
        backgroundColor: COLORS.surfaceElevated,
        borderColor: COLORS.errorBorder,
        borderWidth: 1,
        borderRadius: 16,
        height: 64,
      }}
      contentContainerStyle={{ paddingHorizontal: 16 }}
      text1Style={{
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.error,
      }}
      text2Style={{
        fontSize: 12,
        color: COLORS.textSecondary,
      }}
    />
  ),
  info: (props) => (
    <BaseToast
      {...props}
      style={{
        borderLeftColor: COLORS.accentLight,
        backgroundColor: COLORS.surfaceElevated,
        borderColor: COLORS.border,
        borderWidth: 1,
        borderRadius: 16,
        height: 64,
      }}
      contentContainerStyle={{ paddingHorizontal: 16 }}
      text1Style={{
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.text,
      }}
      text2Style={{
        fontSize: 12,
        color: COLORS.textSecondary,
      }}
    />
  ),
};

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <StatusBar style="light" backgroundColor={COLORS.bg} />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: COLORS.bg },
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
        <Toast config={toastConfig} />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
});
