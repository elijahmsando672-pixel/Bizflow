import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicPaths = [
  "/",
  "/login",
  "/signup",
  "/register",
  "/reset-password",
  "/accept-invite",
  // Verification links are opened from an email by users who have no session yet,
  // so this must stay reachable before login.
  "/verify-email",
  "/pricing",
  "/features",
  "/about",
  "/contact",
  "/select-shop",
];

/** Post-authentication landing route. See lib/auth-context.tsx. */
const POST_AUTH_ROUTE = "/business";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("token")?.value;

  if (!token && !publicPaths.includes(pathname)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (token && publicPaths.includes(pathname) && pathname !== "/" && pathname !== "/login" && pathname !== "/select-shop") {
    return NextResponse.redirect(new URL(POST_AUTH_ROUTE, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|css|js|json|woff2?|ttf|eot)).*)"],
};
