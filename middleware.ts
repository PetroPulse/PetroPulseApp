// middleware.ts (must be in the project root)

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};

export function middleware(req: NextRequest) {
  const url = req.nextUrl;

  // 1. Try to get org ID from URL ?org_id=
  const orgId =
    url.searchParams.get("org_id") ||
    req.cookies.get("org_id")?.value ||
    "";

  const res = NextResponse.next({
    request: { headers: new Headers(req.headers) },
  });

  // 2. Persist cookie if we found an org ID
  if (orgId) {
    res.cookies.set("org_id", orgId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });

    res.headers.set("x-org-id", orgId);
  }

  return res;
}
