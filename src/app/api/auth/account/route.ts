import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { AuthUtils } from "@/server/utils/auth";
import { ApiResponse } from "@/server/utils/api-response";
import { AppError } from "@/server/utils/errors";
import { Logger } from "@/server/services/logger.service";
import { AccountDeletionService } from "@/server/services/account-deletion.service";

export async function DELETE(request: NextRequest) {
     try {
          const cookieStore = await cookies();

          const { userId } = await AuthUtils.authenticateRequest(request);

          Logger.info("Account deletion requested", { userId });

          await AccountDeletionService.deleteAccount(userId);

          const response = ApiResponse.success({ message: "Account deleted successfully" });
          response.cookies.delete("refreshToken");

          return response;
     } catch (error) {
          if (error instanceof AppError) {
               Logger.error("Account deletion error", { message: error.message });
               return ApiResponse.error(error.message, error.statusCode);
          }

          Logger.error("Unhandled account deletion error", { error });
          return ApiResponse.error("Internal server error", 500);
     }
}
