import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { z } from "zod";

export const trackedFilesTable = sqliteTable("tracked_files", {
  path: text().primaryKey(),
  sha1: text().notNull(),
});

export const releasesTable = sqliteTable("releases", {
  id: int().primaryKey({ autoIncrement: true }),
  files: text().notNull(), // ReleaseFileJsonSchema => { path: string; sha1: string; }[]
});

export const ReleaseFileJsonSchema = z.array(
  z.object({
    path: z.string(),
    sha1: z.string(),
  })
);

export const TrackedFileSchema = z.object({
  path: z.string(),
  sha1: z.string(),
});



