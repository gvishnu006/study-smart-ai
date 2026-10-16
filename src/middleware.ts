import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware() {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/materials/:path*",
    "/quiz/:path*",
    "/summarize/:path*",
    "/tracker/:path*",
    "/planner/:path*",
    "/focus/:path*",
    "/doubts/:path*",
    "/goals/:path*",
    "/report/:path*",
    "/settings/:path*",
  ],
};
