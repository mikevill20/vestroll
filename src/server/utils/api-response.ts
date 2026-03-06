import { NextResponse } from "next/server";

type ApiResponseOptions<T> = {
  message?: string;
  data?: T;
  status?: number;
  errors?: Record<string, unknown> | null;
};

export class ApiResponse {
  static success<T>(
    data: T,
    message: string = "Success",
    status: number = 200
  ) {
    return NextResponse.json(
      {
        success: true,
        message,
        data,
      },
      { status }
    );
  }

  static error(
    message: string = "Internal Server Error",
    status: number = 500,
    errors: Record<string, unknown> | null = null
  ) {
    return NextResponse.json(
      {
        success: false,
        message,
        errors,
      },
      { status }
    );
  }
}
