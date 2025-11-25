import { NextResponse } from "next/server";

export async function middleware(req) {
  const cookie = req.cookies.get("accessToken");
  const isFeed = req.nextUrl.pathname.startsWith("/feed");

  if (isFeed && !cookie) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/feed/:path*"],
};