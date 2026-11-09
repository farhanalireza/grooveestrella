// src/app/(auth)/login/page.jsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Music, Lock, Mail, ArrowRight, Sparkles, AlertCircle } from "lucide-react";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { toast } from "@/lib/toast";

export default function LoginPage() {
  const router = useRouter();
  const { signInWithPassword, isConfigured } = useSupabaseAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!email || !password) {
      setErrorMsg("Please enter both email and password.");
      return;
    }

    setLoading(true);
    const { data, error } = await signInWithPassword(email, password);
    setLoading(false);

    if (error) {
      setErrorMsg(error.message || "Failed to sign in. Please verify your credentials.");
      return;
    }

    if (data?.user) {
      router.push("/account");
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 sm:px-6 py-12">
      <div className="w-full max-w-md space-y-8 rounded-3xl bg-[var(--theme-card)]/80 backdrop-blur-2xl border border-[var(--theme-border)] p-8 shadow-2xl text-[var(--theme-fg)]">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <img src="/in.svg" alt="GrooveEstrella" className="w-9 h-9 object-contain" />
            <span className="text-2xl font-black tracking-tight font-display text-[var(--theme-fg)]">
              GrooveEstrella
            </span>
          </Link>
          <h1 className="text-xl font-bold text-[var(--theme-fg)] pt-2">
            Welcome back to your music sanctuary
          </h1>
          <p className="text-xs text-[var(--theme-muted)]">
            Log in to access your private Music Journal, ratings, and library.
          </p>
        </div>

        {!isConfigured && (
          <div className="p-3.5 rounded-2xl bg-amber-400/10 border border-amber-400/25 flex items-start gap-2.5 text-xs text-amber-200">
            <Sparkles size={16} className="text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Supabase Setup Notice</p>
              <p className="text-[11px] text-amber-200/80 mt-0.5">
                Add your Supabase credentials in <code className="px-1 py-0.5 bg-black/30 rounded">.env.local</code> to connect live authentication. You can still test with local storage in demo mode!
              </p>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-center gap-2 text-xs text-rose-300">
            <AlertCircle size={15} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--theme-muted)]">
              Email Address
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--theme-muted)]" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="critic@grooveestrella.com"
                required
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[var(--theme-surface)]/80 border border-[var(--theme-border)] text-sm text-[var(--theme-fg)] placeholder:text-[var(--theme-muted)]/50 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--theme-muted)]">
                Password
              </label>
            </div>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--theme-muted)]" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[var(--theme-surface)]/80 border border-[var(--theme-border)] text-sm text-[var(--theme-fg)] placeholder:text-[var(--theme-muted)]/50 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 text-zinc-950 font-black text-sm tracking-wide hover:opacity-95 active:scale-98 transition shadow-lg shadow-amber-400/20 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span>{loading ? "Signing in..." : "Sign In"}</span>
            <ArrowRight size={16} />
          </button>
        </form>

        <div className="text-center pt-2 border-t border-[var(--theme-border)]/50 text-xs text-[var(--theme-muted)]">
          <span>Don't have an account? </span>
          <Link href="/signup" className="font-bold text-amber-300 hover:underline">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}
