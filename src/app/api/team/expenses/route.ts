import { NextRequest, NextResponse } from "next/server";
import { TeamService } from "@/server/services/team.service";
import { z } from "zod";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const organizationId = searchParams.get("organizationId");

        if (!organizationId) {
            return NextResponse.json(
                { message: "organizationId query parameter is required" },
                { status: 400 }
            );
        }

        const parsedOrganizationId = z.string().uuid().safeParse(organizationId);
        if (!parsedOrganizationId.success) {
            return NextResponse.json(
                { message: "organizationId must be a valid UUID" },
                { status: 400 }
            );
        }

        const expenses = await TeamService.getExpenses(organizationId);

        return NextResponse.json(expenses, { status: 200 });
    } catch (error: unknown) {
        console.error("Error fetching expenses:", error);
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}
