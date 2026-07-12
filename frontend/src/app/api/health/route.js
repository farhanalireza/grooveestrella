// src/app/api/health/route.js
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ status: "ok", message: "Backend API is running" });
}
