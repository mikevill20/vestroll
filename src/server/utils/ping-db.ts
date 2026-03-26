import { db } from "@/server/db";
import { sql } from "drizzle-orm";

/**
 * Pings the database to check connectivity.
 * @returns {Promise<boolean>} True if the database is reachable, false otherwise.
 */
export async function pingDb(): Promise<boolean> {
  try {
    await db.execute(sql`SELECT 1`);
    return true;
  } catch (error) {
    console.error("Database ping failed:", error);
    return false;
  }
}
