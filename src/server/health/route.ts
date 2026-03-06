import { ApiResponse } from "@/server/utils/api-response";

export async function GET() {
  return ApiResponse.success(
    {
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
    },
    "System is healthy"
  );
}
