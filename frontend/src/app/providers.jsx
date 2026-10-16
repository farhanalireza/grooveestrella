// src/app/providers.jsx
"use client";
import React from 'react';
import { PlayerProvider } from '@/contexts/PlayerContext';
import { AuthProvider } from '@/hooks/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';

export function Providers({ children }) {
  return (
    <ThemeProvider>
      <PlayerProvider>
        <AuthProvider>
          {children}
        </AuthProvider>
      </PlayerProvider>
    </ThemeProvider>
  );
}
