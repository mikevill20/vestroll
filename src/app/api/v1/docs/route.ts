import { NextResponse } from "next/server";
import { swaggerSpec } from "@/server/swagger-config";

export async function GET() {
  return NextResponse.json(swaggerSpec);
}
