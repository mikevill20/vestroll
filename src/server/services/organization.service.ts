import { db, organizations } from "../db";
import { eq, isNull, isNotNull, and } from "drizzle-orm";
import { NotFoundError } from "../utils/errors";

export interface Organization {
  id: string;
  name: string;
  industry: string | null;
  registrationNumber: string | null;
  registeredStreet: string | null;
  registeredCity: string | null;
  registeredState: string | null;
  registeredPostalCode: string | null;
  registeredCountry: string | null;
  billingStreet: string | null;
  billingCity: string | null;
  billingState: string | null;
  billingPostalCode: string | null;
  billingCountry: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export class OrganizationService {
  /**
   * Internal helper: get organization by ID (optionally include deleted)
   */
  private static async findById(
    organizationId: string,
    includeDeleted = false
  ) {
    const conditions = includeDeleted
      ? eq(organizations.id, organizationId)
      : and(
          eq(organizations.id, organizationId),
          isNull(organizations.deletedAt)
        );

    const [organization] = await db
      .select()
      .from(organizations)
      .where(conditions)
      .limit(1);

    return organization || null;
  }

  /**
   * Soft delete an organization
   */
  static async softDelete(organizationId: string): Promise<void> {
    const organization = await this.findById(organizationId, true);

    if (!organization) {
      throw new NotFoundError("Organization not found");
    }

    if (organization.deletedAt) {
      // Already deleted → no-op
      return;
    }

    await db
      .update(organizations)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(organizations.id, organizationId),
          isNull(organizations.deletedAt)
        )
      );
  }

  /**
   * Restore a soft-deleted organization
   */
  static async restore(organizationId: string): Promise<void> {
    const organization = await this.findById(organizationId, true);

    if (!organization) {
      throw new NotFoundError("Organization not found");
    }

    if (!organization.deletedAt) {
      // Not deleted → no-op
      return;
    }

    await db
      .update(organizations)
      .set({
        deletedAt: null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(organizations.id, organizationId),
          isNotNull(organizations.deletedAt)
        )
      );
  }

  /**
   * Get all active (non-deleted) organizations
   */
  static async getActiveOrganizations(): Promise<Organization[]> {
    return db
      .select()
      .from(organizations)
      .where(isNull(organizations.deletedAt));
  }

  /**
   * Get a single organization by ID (only if not deleted)
   */
  static async getById(organizationId: string): Promise<Organization | null> {
    return this.findById(organizationId, false);
  }

  /**
   * Get organization by ID regardless of deleted status (admin use)
   */
  static async getByIdIncludingDeleted(
    organizationId: string
  ): Promise<Organization | null> {
    return this.findById(organizationId, true);
  }

  /**
   * Get all organizations including deleted ones (admin use)
   */
  static async getAllOrganizations(): Promise<Organization[]> {
    return db.select().from(organizations);
  }

  /**
   * Permanently delete an organization (DANGEROUS)
   * Intended for admin/internal use only
   */
  static async hardDelete(organizationId: string): Promise<void> {
    // Optional safety guard (recommended)
    if (process.env.NODE_ENV === "production") {
      throw new Error("Hard delete is not allowed in production");
    }

    await db.delete(organizations).where(eq(organizations.id, organizationId));
  }
}