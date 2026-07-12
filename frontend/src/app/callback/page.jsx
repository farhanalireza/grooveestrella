// src/app/callback/page.jsx
"use client";

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/AuthContext';
import { Loader } from 'lucide-react';
import { API_BASE_URL } from '@/lib/apiClient';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuthTokens } = useAuth();

  useEffect(() => {
    const code = searchParams.get('code');

    if (!code) {
      alert("No Spotify code found in URL. Please try logging in again.");
      router.push("/");
      return;
    }

    // Step 1: Exchange code → backend (sets session cookie)
    fetch(`${API_BASE_URL}/callback?code=${encodeURIComponent(code)}`, {
      method: "GET",
    })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        return response.json();
      })
      .then((data) => {
        // Step 2: Verify session by calling /me
        return fetch(`${API_BASE_URL}/me`, {
          method: "GET",
        });
      })
      .then((res) => {
        if (!res.ok) throw new Error("Session verification failed");
        return res.json();
      })
      .then((profileData) => {
        // Step 3: Set dummy token to indicate 'authenticated'
        setAuthTokens({ sessionActive: true });
        router.push("/account?key=spotify-login");
      })
      .catch((error) => {
        console.error("Error during callback/session verification:", error);
        alert("Authentication failed. Please try logging in again.");
        router.push("/");
      });
  }, [searchParams, router, setAuthTokens]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#07090F] text-[#F4F7FF]">
      <Loader className="animate-spin w-8 h-8 mr-3 text-[#60A5FA]" />
      <span className="text-lg">Processing your Spotify Login...</span>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-[#07090F] text-[#F4F7FF]">
        <Loader className="animate-spin w-8 h-8 mr-3 text-[#60A5FA]" />
        <span className="text-lg">Loading...</span>
      </div>
    }>
      <CallbackContent />
    </Suspense>
  );
}
