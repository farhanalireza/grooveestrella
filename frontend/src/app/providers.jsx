// src/app/providers.jsx
"use client";
import React from 'react';
import { PlayerProvider } from '@/contexts/PlayerContext';
import { AuthProvider } from '@/hooks/AuthContext';

export function Providers({ children }) {
  return (
    <PlayerProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </PlayerProvider>
  );
}
