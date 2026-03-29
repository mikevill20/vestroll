import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  // ── Slow API Simulator (Issue #395) ──────────────────────────────────────
  // Set SIMULATE_SLOW_API=true in .env.local then run `pnpm dev`.
  // Every /api/* response will be held for 2 s, making loading states and
  // Next.js suspension boundaries clearly visible during development.
  if (process.env.SIMULATE_SLOW_API === "true") {
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
