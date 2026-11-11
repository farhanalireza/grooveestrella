// src/contexts/SupabaseAuthContext.jsx
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { toast } from "@/lib/toast";

const SupabaseAuthContext = createContext({
  user: null,
  profile: null,
  session: null,
  loading: true,
  isConfigured: false,
  signInWithPassword: async () => {},
  signUpWithPassword: async () => {},
  signOut: async () => {},
  updateProfile: async () => {},
  refreshProfile: async () => {},
});

export function SupabaseAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState(false);
  const fetchedUserIdRef = useRef(null);
  const inFlightProfileRef = useRef(null);

  const fetchProfile = useCallback(async (userId, client, { force = false } = {}) => {
    if (!userId || !client) return null;
    if (!force && fetchedUserIdRef.current === userId && inFlightProfileRef.current) {
      return inFlightProfileRef.current;
    }
    const req = (async () => {
      try {
        const { data, error } = await client
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .maybeSingle();

        if (!error && data) {
          fetchedUserIdRef.current = userId;
          setProfile(data);
          return data;
        }
      } catch (err) {
        console.warn("Failed to fetch user profile:", err?.message);
      }
      return null;
    })();
    inFlightProfileRef.current = req;
    const res = await req;
    inFlightProfileRef.current = null;
    return res;
  }, []);

  useEffect(() => {
    const isReady = isSupabaseConfigured();
    setConfigured(isReady);

    if (!isReady) {
      // Offline / Unconfigured fallback: load guest profile from localStorage
      try {
        const guestName = localStorage.getItem("userName") || "Groove Guest";
        const guestAvatar = localStorage.getItem("userAvatar") || "";
        setProfile({
          id: "guest",
          username: guestName.toLowerCase().replace(/\s+/g, "_"),
          display_name: guestName,
          avatar_url: guestAvatar,
          bio: "Guest Explorer on GrooveEstrella",
        });
      } catch (_) {}
      setLoading(false);
      return;
    }

    const supabase = createClient();

    // Listen for initial session + auth state changes (avoids double query vs getSession)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          if (fetchedUserIdRef.current !== currentSession.user.id || event === "USER_UPDATED") {
            await fetchProfile(currentSession.user.id, supabase);
          }
        } else {
          fetchedUserIdRef.current = null;
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signInWithPassword = async (email, password) => {
    if (!isSupabaseConfigured()) {
      toast.info("Supabase is not yet connected. Running in demo mode.");
      return { data: null, error: new Error("Supabase is not configured.") };
    }
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error(error.message || "Failed to sign in");
      return { data: null, error };
    }

    toast.success("Welcome back to GrooveEstrella! 🎵");
    if (data.user) {
      await fetchProfile(data.user.id, supabase);
    }
    return { data, error: null };
  };

  const signUpWithPassword = async (email, password, { username, displayName, bio } = {}) => {
    if (!isSupabaseConfigured()) {
      toast.info("Supabase is not yet connected. Running in demo mode.");
      return { data: null, error: new Error("Supabase is not configured.") };
    }
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username || email.split("@")[0],
          display_name: displayName || username || "Groove Lover",
          bio: bio || "Exploring music on GrooveEstrella",
        },
      },
    });

    if (error) {
      toast.error(error.message || "Failed to create account");
      return { data: null, error };
    }

    toast.success("Account created! Check your email to confirm if needed.");
    if (data.user) {
      await fetchProfile(data.user.id, supabase);
    }
    return { data, error: null };
  };

  const signOut = async () => {
    if (isSupabaseConfigured()) {
      const supabase = createClient();
      await supabase.auth.signOut();
    }
    fetchedUserIdRef.current = null;
    setUser(null);
    setProfile(null);
    setSession(null);
    toast.info("Signed out successfully");
  };

  const updateProfile = async (updates) => {
    if (!user) {
      toast.error("You must be logged in to update your profile");
      return { data: null, error: new Error("Not authenticated") };
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from("profiles")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)
      .select()
      .single();

    if (error) {
      toast.error(error.message || "Failed to update profile");
      return { data: null, error };
    }

    setProfile(data);
    toast.success("Profile updated! ✨");
    return { data, error: null };
  };

  const refreshProfile = async () => {
    if (user) {
      const supabase = createClient();
      await fetchProfile(user.id, supabase, { force: true });
    }
  };

  return (
    <SupabaseAuthContext.Provider
      value={{
        user,
        profile,
        session,
        loading,
        isConfigured: configured,
        signInWithPassword,
        signUpWithPassword,
        signOut,
        updateProfile,
        refreshProfile,
      }}
    >
      {children}
    </SupabaseAuthContext.Provider>
  );
}

export const useSupabaseAuth = () => useContext(SupabaseAuthContext);
