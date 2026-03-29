import { describe, it, expect, beforeEach, vi } from "vitest";
import { GET } from "./route";
import { NextRequest } from "next/server";
import { TimeOffService } from "@/server/services/time-off.service";
import { AuthUtils } from "@/server/utils/auth";
import { UnauthorizedError, ForbiddenError } from "@/server/utils/errors";

vi.mock("@/server/services/time-off.service");
vi.mock("@/server/utils/auth");

describe("GET /api/v1/team/time-off", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const createMockRequest = (): NextRequest => {
        return new NextRequest(new URL("http://localhost:3000/api/v1/team/time-off"));
    };

    const mockTimeOffResponse = [
        {
            id: "1",
            employeeName: "James Akinbiola",
            type: "Vacation",
            startDate: new Date("2024-01-01"),
            endDate: new Date("2024-01-05"),
            totalDuration: 5,
            status: "Approved",
            submittedAt: new Date("2023-12-25"),
        },
    ];

    it("should return time-off requests for authenticated user", async () => {
        vi.mocked(AuthUtils.authenticateRequest).mockResolvedValue({
            userId: "user-123",
        } as any);
        vi.mocked(TimeOffService.getTimeOffRequests).mockResolvedValue(
            mockTimeOffResponse as any
        );

        const req = createMockRequest();
        const response = await GET(req);

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.message).toBe("Time-off requests retrieved successfully");
        expect(data.data).toHaveLength(1);
        expect(data.data[0].employeeName).toBe("James Akinbiola");
    });

    it("should return 401 for unauthenticated request", async () => {
        vi.mocked(AuthUtils.authenticateRequest).mockRejectedValue(
            new UnauthorizedError()
        );

        const req = createMockRequest();
        const response = await GET(req);

        expect(response.status).toBe(401);
    });

    it("should return 403 when user has no organization", async () => {
        vi.mocked(AuthUtils.authenticateRequest).mockResolvedValue({
            userId: "user-123",
        } as any);
        vi.mocked(TimeOffService.getTimeOffRequests).mockRejectedValue(
            new ForbiddenError("User is not associated with any organization")
        );

        const req = createMockRequest();
        const response = await GET(req);

        expect(response.status).toBe(403);
        const data = await response.json();
        expect(data.message).toBe("User is not associated with any organization");
    });

    it("should return 500 for unexpected errors", async () => {
        vi.mocked(AuthUtils.authenticateRequest).mockResolvedValue({
            userId: "user-123",
        } as any);
        vi.mocked(TimeOffService.getTimeOffRequests).mockRejectedValue(
            new Error("Database connection failed")
        );

        const req = createMockRequest();
        const response = await GET(req);

        expect(response.status).toBe(500);
    });
});


