// src/app/(auth)/signup/page.jsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Music, Lock, Mail, User, ArrowRight, Sparkles, AlertCircle } from "lucide-react";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";

export default function SignUpPage() {
  const router = useRouter();
  const { signUpWithPassword, isConfigured } = useSupabaseAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSignUp = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!email || !password) {
      setErrorMsg("Please provide an email and password.");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    const { data, error } = await signUpWithPassword(email, password, {
      username: username || email.split("@")[0],
      displayName: displayName || username || "Groove Lover",
    });
    setLoading(false);

    if (error) {
      setErrorMsg(error.message || "Failed to create account. Please try again.");
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
            Create your Music Journal
          </h1>
          <p className="text-xs text-[var(--theme-muted)]">
            Begin logging your album journeys, assigning critical scores, and sharing your musical perspective.
          </p>
        </div>

        {!isConfigured && (
          <div className="p-3.5 rounded-2xl bg-amber-400/10 border border-amber-400/25 flex items-start gap-2.5 text-xs text-amber-200">
            <Sparkles size={16} className="text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Supabase Setup Notice</p>
              <p className="text-[11px] text-amber-200/80 mt-0.5">
                Connect your Supabase project in <code className="px-1 py-0.5 bg-black/30 rounded">.env.local</code> to enable real authentication and automatic profile creation via triggers.
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

        {/* SignUp Form */}
        <form onSubmit={handleSignUp} className="space-y-4">
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

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--theme-muted)]">
                Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                  placeholder="soundcritic"
                  className="w-full px-4 py-3 rounded-2xl bg-[var(--theme-surface)]/80 border border-[var(--theme-border)] text-sm text-[var(--theme-fg)] placeholder:text-[var(--theme-muted)]/50 focus:outline-none focus:border-amber-400 font-mono text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--theme-muted)]">
                Display Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Miles Davis"
                  className="w-full px-4 py-3 rounded-2xl bg-[var(--theme-surface)]/80 border border-[var(--theme-border)] text-sm text-[var(--theme-fg)] placeholder:text-[var(--theme-muted)]/50 focus:outline-none focus:border-amber-400 text-xs"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--theme-muted)]">
              Password
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--theme-muted)]" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                required
                minLength={6}
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[var(--theme-surface)]/80 border border-[var(--theme-border)] text-sm text-[var(--theme-fg)] placeholder:text-[var(--theme-muted)]/50 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 text-zinc-950 font-black text-sm tracking-wide hover:opacity-95 active:scale-98 transition shadow-lg shadow-amber-400/20 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span>{loading ? "Creating Account..." : "Create Account"}</span>
            <ArrowRight size={16} />
          </button>
        </form>

        <div className="text-center pt-2 border-t border-[var(--theme-border)]/50 text-xs text-[var(--theme-muted)]">
          <span>Already have an account? </span>
          <Link href="/login" className="font-bold text-amber-300 hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
