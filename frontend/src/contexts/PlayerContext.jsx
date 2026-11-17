// src/contexts/PlayerContext.jsx
"use client";
import React, { createContext, useContext, useState, useCallback, useMemo } from "react";

const PlayerContext = createContext();

export const PlayerProvider = ({ children }) => {
  const [visiblePlayer] = useState(false);
  const [playbackInfo] = useState({
    uri: null,
    isContext: false,
    offset: null,
    positionMs: 0,
  });

  const showPlayer = useCallback((uri, isContext = false, offset = null, positionMs = 0) => {
    // Stubbed: No-op because playback is deprecated
    console.log("Playback is deprecated. Directing to deep links instead.");
  }, []);

  const value = useMemo(() => ({
    visiblePlayer,
    playbackInfo,
    showPlayer,
    isPremium: false,
    isAuthenticated: false
  }), [visiblePlayer, playbackInfo, showPlayer]);

  return (
    <PlayerContext.Provider value={value}>
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error("usePlayer must be used within a PlayerProvider");
  }
  return context;
};
