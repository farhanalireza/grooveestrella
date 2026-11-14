// src/app/settings/page.jsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import DiscLoader from "@/Components/DiscLoader";

export default function SettingsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/account?tab=settings");
  }, [router]);

  return (
    <div className="min-h-screen py-24 flex flex-col items-center justify-center gap-3">
      <DiscLoader size={36} />
      <span className="text-xs font-bold uppercase tracking-widest text-[var(--theme-muted)]">
        Opening Settings in Account...
      </span>
    </div>
  );
}
