import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Allow static assets, images, and public metadata
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.includes(".") // static files like .png, .css, .ico, .svg
  ) {
    return NextResponse.next();
  }

  // 2. Allow authentication API routes, public health check, and model metrics export
  if (
    pathname.startsWith("/api/auth") ||
    pathname === "/api/metrics" ||
    pathname === "/api/health"
  ) {
    return NextResponse.next();
  }

  // 3. Extract and verify session token from HttpOnly cookie
  const sessionToken = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionToken(sessionToken);
  const isAuthenticated = session !== null;

  // 4. API routes protection (except the public ones checked above)
  if (pathname.startsWith("/api/")) {
    if (!isAuthenticated) {
      return NextResponse.json(
        { error: "Unauthorized: Active retail operator session required." },
        { status: 401 }
      );
    }
    return NextResponse.next();
  }

  // 5. Handling for "/" (Visitor Root)
  if (pathname === "/") {
    if (isAuthenticated) {
      // Authenticated visitor goes to overview
      const overviewUrl = new URL("/overview", req.url);
      return NextResponse.redirect(overviewUrl);
    } else {
      // Unauthenticated visitor lands on login screen first
      const loginUrl = new URL("/login", req.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 6. Handling for "/login"
  if (pathname === "/login") {
    if (isAuthenticated) {
      // Already signed in -> redirect to overview
      const overviewUrl = new URL("/overview", req.url);
      return NextResponse.redirect(overviewUrl);
    }
    return NextResponse.next();
  }

  // 7. Protected application routes
  const protectedPaths = [
    "/overview",
    "/demand-forecast",
    "/inventory-risk",
    "/markdown-planner",
    "/model-performance",
    "/mobile",
  ];

  const isProtected = protectedPaths.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );

  if (isProtected && !isAuthenticated) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
