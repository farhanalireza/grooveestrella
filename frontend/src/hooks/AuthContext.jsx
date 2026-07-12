// src/hooks/AuthContext.jsx
"use client";
import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authTokens, setAuthTokens] = useState(null);
  const isAuthenticated = !!authTokens?.sessionActive;

  const logout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout request failed:', err);
    }
    setAuthTokens(null);
    window.location.href = '/'; // Full reload logout
  };

  return (
    <AuthContext.Provider value={{ authTokens, setAuthTokens, isAuthenticated, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
