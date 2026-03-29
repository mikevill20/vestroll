import { NextRequest, NextResponse } from "next/server";
import { JWTService } from "@/server/services/jwt.service";
import { updateLastActive } from "@/server/middleware/update-last-active.middleware";

export function middleware(req: NextRequest) {
  const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS?.split(",") ?? [];
  const origin = req.headers.get("origin");

  // If the request has an origin and it's not in the allowed list, reject it.
  // Note: Standard browser behavior for non-CORS requests (like direct URL entry) doesn't include an 'origin' header.
  if (origin && !allowedOrigins.includes(origin)) {
    return new NextResponse(null, {
      status: 403,
      statusText: "Forbidden: Origin not allowed",
    });
  }

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    if (origin && allowedOrigins.includes(origin)) {
      const response = new NextResponse(null, { status: 200 });
      response.headers.set("Access-Control-Allow-Origin", origin);
      response.headers.set(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS, PATCH"
      );
      response.headers.set(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization, X-Requested-With"
      );
      response.headers.set("Access-Control-Max-Age", "86400");
      return response;
    }
  }

  const token =
    req.cookies.get("access_token")?.value ??
    req.headers.get("authorization")?.replace("Bearer ", "");

  if (token) {
    try {
      const { userId } = JWTService.verifyAccessToken(token);
      updateLastActive(userId);
    } catch {
      // invalid/expired token — let the route handler deal with it
    }
  }

  const response = NextResponse.next();

  // For non-OPTIONS requests, add the Access-Control-Allow-Origin header if the origin is allowed.
  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
  }

  return response;
}

export const config = {
  matcher: "/api/:path*",
};
