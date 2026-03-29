import { NextRequest, NextResponse } from "next/server";
import { JWTService } from "@/server/services/jwt.service";

export async function middleware(req: NextRequest) {
  // Generate a standard UUID (v4)
  const responseId = crypto.randomUUID();

  // Clone headers to inject it into the request for downstream use
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-response-id", responseId);

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
        "GET, POST, PUT, DELETE, OPTIONS, PATCH",
      );
      response.headers.set(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization, X-Requested-With",
      );
      response.headers.set("Access-Control-Max-Age", "86400");
      response.headers.set("x-response-id", responseId);
      return response;
    }
  }

  const token =
    req.cookies.get("access_token")?.value ??
    req.headers.get("authorization")?.replace("Bearer ", "");

  if (token) {
    try {
      await JWTService.verifyAccessToken(token);
      // Removed updateLastActive(userId) because it uses standard PG driver which is not edge-compatible.
    } catch {
      // invalid/expired token — let the route handler deal with it
    }
  }

  // Pass along the modified request headers
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  response.headers.set("Vary", "Accept-Encoding");

  // For non-OPTIONS requests, add the Access-Control-Allow-Origin header if the origin is allowed.
  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
  }

  // Attach the same UUID to the response headers
  response.headers.set("x-response-id", responseId);

  return response;
}

export const config = {
  matcher: "/api/v1/:path*",
};

