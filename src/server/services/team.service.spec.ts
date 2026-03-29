import { describe, it, expect, vi, beforeEach } from "vitest";
import { TeamService } from "./team.service";
import { db } from "../db";

vi.mock("../db", () => ({
    db: {
        select: vi.fn(),
        insert: vi.fn(),
    },
    users: {
        email: "email",
        id: "id",
        status: "status",
        createdAt: "created_at",
    },
    organizations: {
        id: "id",
    },
    expenses: {
        id: "id",
        name: "name",
        category: "category",
        amount: "amount",
        status: "status",
        attachmentUrl: "attachmentUrl",
        organizationId: "organizationId"
    }
}));

describe("TeamService", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should throw 409 if email already exists", async () => {
        const selectMock = {
            from: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue([{ id: "existing" }]),
        };
        vi.mocked(db.select).mockReturnValue(selectMock as never);

        try {
            await TeamService.addEmployee({ email: "test@test.com" });
            expect.fail("Should have thrown error");
        } catch (err: unknown) {
            expect(err).toBeInstanceOf(Error);
            expect((err as Error).message).toBe("Email already registered");
            expect(err).toMatchObject({ status: 409 });
        }
    });

    it("should create user with pending status if email does not exist", async () => {
        const selectMock = {
            from: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue([]),
        };
        vi.mocked(db.select).mockReturnValue(selectMock as never);

        const date = new Date();
        const insertMock = {
            values: vi.fn().mockReturnThis(),
            returning: vi.fn().mockResolvedValue([{ id: "new-id", status: "pending_verification", invitedAt: date }]),
        };
        vi.mocked(db.insert).mockReturnValue(insertMock as never);

        const user = await TeamService.addEmployee({ email: "test@test.com" });
        expect(user.id).toBe("new-id");
        expect(user.status).toBe("pending_verification");
        expect(user.invitedAt).toBe(date);
    });

    it("should fetch expenses for a given organizationId", async () => {
        const mockExpenses = [
            {
                id: "exp-1",
                expenseName: "Flight",
                category: "Travel",
                amount: 500,
                status: "pending",
                attachmentUrl: "http://example.com/receipt.pdf"
            }
        ];

        const selectMock = {
            from: vi.fn().mockReturnThis(),
            where: vi.fn().mockResolvedValue(mockExpenses),
        };
        vi.mocked(db.select).mockReturnValue(selectMock as never);

        const expenses = await TeamService.getExpenses("org-123");
        expect(expenses).toEqual(mockExpenses);
    });
});
