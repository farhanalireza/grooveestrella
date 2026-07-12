// src/lib/apiClient.js

// In Next.js, API routes live under /api/*
// Setting the fallback to "/api" automatically redirects all legacy client API calls
// (such as ${API_BASE_URL}/songs) to co-located Next.js API endpoints (such as /api/songs).
export const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "") || "/api";
