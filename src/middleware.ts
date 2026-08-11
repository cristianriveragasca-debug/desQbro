import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const role = (req.auth?.user as { role?: string } | undefined)?.role;
  const isParent = role === "PARENT";
  const path = req.nextUrl.pathname;

  const isParentArea = path === "/brujula" || path.startsWith("/brujula/");
  const isParentLogin = path === "/brujula/login";
  const isStaffLogin = path === "/login";
  const isApiAuth = path.startsWith("/api/auth");

  if (isApiAuth) return NextResponse.next();

  if (!isLoggedIn) {
    if (isParentArea && !isParentLogin) {
      return NextResponse.redirect(new URL("/brujula/login", req.nextUrl.origin));
    }
    if (!isParentArea && !isStaffLogin) {
      return NextResponse.redirect(new URL("/login", req.nextUrl.origin));
    }
    return NextResponse.next();
  }

  if (isParent) {
    if (!isParentArea || isParentLogin) {
      return NextResponse.redirect(new URL("/brujula", req.nextUrl.origin));
    }
    return NextResponse.next();
  }

  // Staff/admin session
  if (isParentArea || isStaffLogin) {
    return NextResponse.redirect(new URL("/", req.nextUrl.origin));
  }
  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
