import { db, users, organizations } from "../db";
import { eq, isNull, and } from "drizzle-orm";
import { NotFoundError } from "../utils/errors";
import * as _ from "lodash";

export interface CompanyProfile {
  name: string;
  industry: string | null;
  registrationNumber: string | null;
  registered: {
    street: string | null;
    city: string | null;
    state: string | null;
    postalCode: string | null;
    country: string | null;
  };
  billing: {
    street: string | null;
    city: string | null;
    state: string | null;
    postalCode: string | null;
    country: string | null;
  };
}

export class CompanyService {
  static async getProfile(userId: string): Promise<CompanyProfile> {
    const [user] = await db
      .select({ organizationId: users.organizationId })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user?.organizationId) {
      throw new NotFoundError("User is not associated with an organization");
    }

    const [org] = await db
      .select()
      .from(organizations)
      .where(
        and(
          eq(organizations.id, user.organizationId),
          isNull(organizations.deletedAt)
        )
      )
      .limit(1);

    if (!org) {
      throw new NotFoundError("Organization not found");
    }

    return {
      name: org.name,
      industry: org.industry,
      registrationNumber: org.registrationNumber,
      registered: {
        street: org.registeredStreet,
        city: org.registeredCity,
        state: org.registeredState,
        postalCode: org.registeredPostalCode,
        country: org.registeredCountry,
      },
      billing: {
        street: org.billingStreet,
        city: org.billingCity,
        state: org.billingState,
        postalCode: org.billingPostalCode,
        country: org.billingCountry,
      },
    };
  }

   static async updateCompanyProfile(userId: string, data: CompanyProfile): Promise<CompanyProfile> {
    const [user] = await db
      .select({ organizationId: users.organizationId })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user?.organizationId) {
      throw new NotFoundError("User is not associated with an organization");
    }

    const [org] = await db
      .select()
      .from(organizations)
      .where(
        and(
          eq(organizations.id, user.organizationId),
          isNull(organizations.deletedAt)
        )
      )
      .limit(1);

    if (!org) {
      throw new NotFoundError("Organization not found");
    }

    if (!data) {
      throw new NotFoundError("Check inputted data for errors");
    }

    const updatedCompanyProfile = _.merge({}, org, data);

    return {...updatedCompanyProfile }
  }

}
