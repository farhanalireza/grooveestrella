// src/app/redirect/page.jsx
"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import GrooveLoader from "@/Components/GrooveLoader";

function RedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [redirectInfo, setRedirectInfo] = useState(null);

  useEffect(() => {
    const page = searchParams.get("page");

    if (!page) {
      router.push("/404");
      return;
    }

    const redirectMap = {
      "the-code-breakers": {
        url: "https://the-code-breakers.vercel.app",
        newTab: true,
        name: "The Code Breakers Website",
      },
      "discord": {
        url: "https://discord.gg/your-invite",
        newTab: true,
        name: "OopsVincent Discord",
      },
      "portfolio": {
        url: "https://oopsvincent.vercel.app",
        newTab: false,
        name: "Vincent’s Portfolio",
      },
    };

    const redirectData = redirectMap[page];

    if (redirectData) {
      setRedirectInfo({ ...redirectData, key: page });
      console.log(`[Analytics] Redirecting to "${redirectData.name}" (${redirectData.url})`);
      
      const timeout = setTimeout(() => {
        if (redirectData.newTab) {
          window.open(redirectData.url, "_blank", "noopener noreferrer");
        } else {
          window.location.href = redirectData.url;
        }
      }, 2000);

      return () => clearTimeout(timeout);
    } else {
      router.push("/404");
    }
  }, [searchParams, router]);

  if (!redirectInfo) {
    return (
      <GrooveLoader fullScreen={true} text="Preparing redirect..." />
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--theme-bg)] text-[var(--theme-fg)] px-6 text-center">
      <h1 className="text-2xl font-semibold mb-4">You're being redirected</h1>
      <p className="text-[var(--theme-muted)] mb-2">
        We're taking you to: <span className="text-[var(--theme-fg)] font-bold underline my-6 tracking-wide">{redirectInfo.name}</span>
      </p>
      <p className="text-xs text-[var(--theme-muted)] mt-4">
        If you're not redirected within a few seconds,{" "}
        <a href={redirectInfo.url} target={redirectInfo.newTab ? "_blank" : "_self"} rel="noopener noreferrer" className="underline text-[var(--theme-accent)]">
          click here
        </a>.
      </p>
    </div>
  );
}

export default function RedirectPage() {
  return (
    <Suspense fallback={
      <GrooveLoader fullScreen={true} text="Loading..." />
    }>
      <RedirectContent />
    </Suspense>
  );
}
