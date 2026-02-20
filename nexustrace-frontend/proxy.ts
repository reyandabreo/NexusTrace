import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes that don't need auth
  const publicPaths = ["/", "/login", "/register"];
  const isPublic = publicPaths.some(
    (p) => pathname === p || pathname.startsWith("/_next") || pathname.startsWith("/api")
  );

  if (isPublic) {
    return NextResponse.next();
  }

  // Check for auth token in cookies or header
  // Since we use localStorage, we check a cookie set by the client
  const token = request.cookies.get("nexustrace-auth")?.value;

  // For now, allow all dashboard routes and let client-side handle auth redirects
  // In production, you'd validate the JWT server-side
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
