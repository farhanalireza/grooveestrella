// src/app/providers.jsx
"use client";
import React from 'react';
import { PlayerProvider } from '@/contexts/PlayerContext';
import { AuthProvider } from '@/hooks/AuthContext';
import { SupabaseAuthProvider } from '@/contexts/SupabaseAuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';

export function Providers({ children }) {
  return (
    <ThemeProvider>
      <SupabaseAuthProvider>
        <PlayerProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </PlayerProvider>
      </SupabaseAuthProvider>
    </ThemeProvider>
  );
}
