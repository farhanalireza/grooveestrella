// src/app/share-target/page.jsx
"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import GrooveLoader from "@/Components/GrooveLoader";
import { toast } from "@/lib/toast";

function ShareTargetHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("Resolving shared music...");

  useEffect(() => {
    async function handleIncomingShare() {
      const url = searchParams.get("url") || "";
      const text = searchParams.get("text") || "";
      const title = searchParams.get("title") || "";

      // Many apps (Spotify, Apple Music, YouTube) put the URL inside `text` or `url`
      const rawInput = (url || text || title || "").trim();

      if (!rawInput) {
        toast.error("No shared music link received.");
        router.replace("/");
        return;
      }

      setStatus("Matching title and artist...");

      try {
        const response = await axios.post("/api/convert", { url: rawInput });
        if (response.data?.success && response.data?.redirectUrl) {
          setStatus("Opening GrooveLink...");
          router.replace(response.data.redirectUrl);
          return;
        }
      } catch (err) {
        console.warn("Share target conversion failed:", err.response?.data || err.message);
      }

      // If exact conversion failed, fall back to Search with the shared text/title
      const fallbackQuery = title || text || rawInput;
      toast.info("Could not auto-match link. Searching catalog instead...");
      router.replace(`/search?q=${encodeURIComponent(fallbackQuery)}`);
    }

    handleIncomingShare();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-[var(--theme-bg)] flex flex-col items-center justify-center p-6 text-center">
      <GrooveLoader fullScreen={true} text={status} />
    </div>
  );
}

export default function ShareTargetPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--theme-bg)] flex flex-col items-center justify-center p-6 text-center">
          <GrooveLoader fullScreen={true} text="Opening shared link in GrooveEstrella..." />
        </div>
      }
    >
      <ShareTargetHandler />
    </Suspense>
  );
}
