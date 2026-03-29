import { describe, it, expect } from "vitest";
import { hasAdminOrManagerRole } from "./role";

describe("role utility", () => {
    describe("hasAdminOrManagerRole", () => {
        it("should return true for 'admin' role", () => {
            expect(hasAdminOrManagerRole("admin")).toBe(true);
        });

        it("should return true for 'manager' role", () => {
            expect(hasAdminOrManagerRole("manager")).toBe(true);
        });

        it("should be case-insensitive", () => {
            expect(hasAdminOrManagerRole("ADMIN")).toBe(true);
            expect(hasAdminOrManagerRole("Manager")).toBe(true);
            expect(hasAdminOrManagerRole("AdMiN")).toBe(true);
        });

        it("should trim the input role", () => {
            expect(hasAdminOrManagerRole(" admin ")).toBe(true);
            expect(hasAdminOrManagerRole("\tmanager\n")).toBe(true);
        });

        it("should return true if the role contains 'admin' or 'manager' keywords", () => {
            expect(hasAdminOrManagerRole("superadmin")).toBe(true);
            expect(hasAdminOrManagerRole("branch_manager")).toBe(true);
            expect(hasAdminOrManagerRole("administrator")).toBe(true);
        });

        it("should return false for roles that do not contain keywords", () => {
            expect(hasAdminOrManagerRole("user")).toBe(false);
            expect(hasAdminOrManagerRole("guest")).toBe(false);
            expect(hasAdminOrManagerRole("reviewer")).toBe(false);
            expect(hasAdminOrManagerRole("staff")).toBe(false);
        });

        it("should return false for null, undefined, or empty strings", () => {
            expect(hasAdminOrManagerRole(null)).toBe(false);
            expect(hasAdminOrManagerRole(undefined)).toBe(false);
            expect(hasAdminOrManagerRole("")).toBe(false);
            expect(hasAdminOrManagerRole("   ")).toBe(false);
        });

        it("should return false for unrelated roles that happen to have similar letters but not the full keywords", () => {
            // The current implementation uses .includes(), so "man" won't match "manager" BUT "manager" will match "man"?
            // Wait, normalizedRole.includes(keyword) where keyword is "admin" or "manager".
            // So "man" should be false. "manager" should be true.
            expect(hasAdminOrManagerRole("man")).toBe(false);
            expect(hasAdminOrManagerRole("adm")).toBe(false);
            expect(hasAdminOrManagerRole("manage")).toBe(false);
        });
    });
});
