// src/app/chat/page.jsx
"use client";

import React from 'react';
import MusicChatbot from '@/Components/chat/MusicChatbotUI';

export default function ChatPage() {
  return (
    <div className='w-full min-h-screen bg-black text-white'>
      <MusicChatbot />
    </div>
  );
}
