import { LibSQLDatabase } from "drizzle-orm/libsql";
import {
  ReleaseFileJsonSchema,
  releasesTable,
  trackedFilesTable,
} from "./schema.ts";
import { max, sql } from "drizzle-orm";
import z from "zod";
import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import { FailedToCreateReleaseNoChangedFiles } from "../errors.ts";

export const CreateReleaseRequestSchema = z.object({
  files: ReleaseFileJsonSchema,
});

export type CreateReleaseRequest = z.infer<typeof CreateReleaseRequestSchema>;

export function createRelease(
  db: BunSQLiteDatabase,
  createReleaseRequest: CreateReleaseRequest
): Promise<{ id: number }> {
  if (createReleaseRequest.files.length === 0) {
    throw new FailedToCreateReleaseNoChangedFiles()
  }
  return db.transaction(async (tx) => {
    const release: typeof releasesTable.$inferInsert = {
      files: JSON.stringify(createReleaseRequest.files),
    };
    await tx.insert(releasesTable).values(release).execute();
    await tx
      .insert(trackedFilesTable)
      .values(createReleaseRequest.files)
      .onConflictDoUpdate({
        target: trackedFilesTable.path,
        set: {
          sha1: sql.raw(`excluded.${trackedFilesTable.sha1.name}`),
        },
      })
      .execute();


    const latestRelease = await tx
      .select({ id: max(releasesTable.id) })
      .from(releasesTable)
      .execute();

    return z.object({ id: z.number() }).parse(latestRelease[0]);
  });
}
