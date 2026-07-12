// src/contexts/PlayerContext.jsx
"use client";
import React, { createContext, useContext, useState } from "react";

const PlayerContext = createContext();

export const PlayerProvider = ({ children }) => {
  const [visiblePlayer] = useState(false);
  const [playbackInfo] = useState({
    uri: null,
    isContext: false,
    offset: null,
    positionMs: 0,
  });

  const showPlayer = (uri, isContext = false, offset = null, positionMs = 0) => {
    // Stubbed: No-op because playback is deprecated
    console.log("Playback is deprecated. Directing to deep links instead.");
  };

  return (
    <PlayerContext.Provider
      value={{
        visiblePlayer,
        playbackInfo,
        showPlayer,
        isPremium: false,
        isAuthenticated: false
      }}
    >
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
