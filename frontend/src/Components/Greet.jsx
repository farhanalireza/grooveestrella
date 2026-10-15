// Greet.jsx
"use client";
import React, { useState, useEffect } from 'react';
import { getOrSetUserName } from '@/lib/nameGenerator';

function greetBasedOnTime() {
    const now = new Date();
    const hour = now.getHours();

    if (hour >= 5 && hour < 12) {
        return "Good Morning";
    } else if (hour >= 12 && hour < 17) {
        return "Good Afternoon";
    } else {
        return "Good Evening";
    }
}

const Greet = () => {
  const [userName, setUserName] = useState('');

  useEffect(() => {
    setUserName(getOrSetUserName());

    const handleStorage = () => {
      setUserName(getOrSetUserName());
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return (
    <h1
      className="text-white text-lg md:text-2xl font-semibold tracking-tight px-5 py-3 md:px-8 md:py-4 border-b border-white/10 bg-black/80 backdrop-blur-md"
      title={userName}
    >
      {greetBasedOnTime()}{userName ? `, ${userName}` : ''}
    </h1>
  );
}

export default Greet;
