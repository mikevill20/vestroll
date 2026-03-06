import { sql } from "drizzle-orm";
import { db } from "../db";
import * as schema from "../db/schema";

export async function resetDatabase() {
  const tableNames = Object.values(schema)
    .filter((entity) => (entity as any).tableName)
    .map((entity) => (entity as any).tableName);

  for (const tableName of tableNames) {
    await db.execute(
      sql.raw(`TRUNCATE TABLE "${tableName}" RESTART IDENTITY CASCADE`),
    );
  }
}
