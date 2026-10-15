// src/app/callback/page.jsx
"use client";

import { useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import GrooveLoader from '@/Components/GrooveLoader';

function CallbackContent() {
  const router = useRouter();

  useEffect(() => {
    // Spotify auth is replaced with open MusicBrainz access.
    // Seamlessly navigate to the account dashboard.
    router.push("/account");
  }, [router]);

  return (
    <GrooveLoader fullScreen={true} text="Redirecting to Dashboard..." />
  );
}

export default function CallbackPage() {
  return (
    <Suspense fallback={
      <GrooveLoader fullScreen={true} text="Loading..." />
    }>
      <CallbackContent />
    </Suspense>
  );
}
