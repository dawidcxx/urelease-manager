import { z } from "zod";
import { trackedFilesTable } from "./schema.ts";
import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";

export type TrackedFile = z.infer<typeof TrackedFileSchema>;

export async function getTrackedFiles(
  db: BunSQLiteDatabase
): Promise<Array<TrackedFile>> {
  const trackedFiles = await db.select().from(trackedFilesTable).execute();
  return trackedFiles;
}

export const TrackedFileSchema = z.object({
  path: z.string(),
  sha1: z.string(),
});
