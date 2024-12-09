import { describe, beforeAll, afterAll, expect, it } from "bun:test";
import { createServer } from "../src/createServer";
import type { FastifyInstance } from "fastify";
import {
  generateSQLiteDrizzleJson,
  generateSQLiteMigration,
} from "drizzle-kit/api";
import { releasesTable, trackedFilesTable } from "../src/db/schema";
import { join } from "path";
import { writeFile } from "node:fs/promises";

const FIXTURES_DIR = join(import.meta.dir, "fixtures");

describe("urelease-manager end2end test suite", () => {
  let serverInstance: FastifyInstance;

  beforeAll(async () => {
    const { app, db } = await createServer({
      dbUrl: ":memory:",
      rootDir: "./test/fixtures",
    });
    const migrations = await generateSQLiteMigration(
      await generateSQLiteDrizzleJson({}),
      await generateSQLiteDrizzleJson({
        trackedFilesTable,
        releasesTable,
      })
    );
    const migrationsSQL = migrations.join("\n");
    console.log("running SQL", migrationsSQL);
    console.log(db.$client.run(migrationsSQL));
    serverInstance = app;
  });

  afterAll(async () => {
    await serverInstance.close();
  });

  it("should lunch the server", () => {
    expect(serverInstance).toBeDefined();
  });

  it("should say that there are zero releases initially", async () => {
    const response = await serverInstance.inject({
      url: "/releases",
      method: "GET",
    });
    expect(response.statusCode).toBe(200);
    expect(response.json<any>()).toEqual([]);
  });

  it("should create a release if we add a file", async () => {
    await writeFixtureFile("hello.txt", "123");
    await serverInstance.inject({
      url: "/releases",
      method: "POST",
    });
    const releases = await serverInstance.inject({
      url: "/releases",
      method: "GET",
    });
    expect(releases.statusCode).toBe(200);
    expect(releases.json<any>()).toEqual([
      {
        id: 1,
        files: [
          {
            path: ".gitignore",
            sha1: "b430ba4b354f8037dcdceff8db8903f7dd0b7c7f",
          },
          {
            path: "hello.txt",
            sha1: "40bd001563085fc35165329ea1ff5c5ecbdbbeef",
          },
        ],
      },
    ]);
  });
});

function writeFixtureFile(
  fileName: string,
  fileContent: string
): Promise<void> {
  return writeFile(join(FIXTURES_DIR, fileName), fileContent, { flag: "w" });
}
