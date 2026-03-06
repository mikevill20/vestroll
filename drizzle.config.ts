import { defineConfig } from "drizzle-kit";
import fs from "node:fs";
import path from "node:path";

function getDatabaseUrl() {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const envLocalPath = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(envLocalPath)) {
    return undefined;
  }

  const envLocal = fs.readFileSync(envLocalPath, "utf8");
  const match = envLocal.match(/^DATABASE_URL=(.+)$/m);
  return match?.[1]?.trim();
}

const databaseUrl = getDatabaseUrl();

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is not set. Add it to .env.local or your shell environment.",
  );
}

export default defineConfig({
  schema: "./src/server/db/schema.ts",
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
});
