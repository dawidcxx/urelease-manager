import { ReleaseFileJsonSchema, releasesTable } from "./schema.ts";
import { gte } from "drizzle-orm";
import z from "zod";
import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";

export type Release = z.infer<typeof ReleaseSchema>;

export async function getReleasesSince(
  db: BunSQLiteDatabase,
  currentRelease: number = FIRST_RELEASE_ID
): Promise<Release[]> {
  const releases = await db
    .select()
    .from(releasesTable)
    .where(gte(releasesTable.id, currentRelease))
    .execute();

  return releases.map(releaseDb => {
    const release: Release = {
      id: releaseDb.id,
      files: JSON.parse(releaseDb.files)
    }
    return ReleaseSchema.parse(release)
  });
}

const FIRST_RELEASE_ID = 1;

const ReleaseSchema = z.object({
  id: z.number(),
  files: ReleaseFileJsonSchema,
});
