import "dotenv/config";
import {
  getEnv,
  getQueryParam,
  mapOptional,
  parseQueryString,
} from "./util.ts";
import { z, ZodError } from "zod";
import { scanChanges } from "./scanChanges.ts";
import { getTrackedFiles } from "./db/getTrackedFiles.ts";
import { createRelease } from "./db/createRelease.ts";
import { ApplicationError } from "./middleware/errors.ts";
import { fastify } from "fastify";
import { join } from "node:path";
import { getReleasesSince } from "./db/getReleasesSince.ts";
import { drizzle } from "drizzle-orm/bun-sqlite";

const rootDir = getEnv("SCAN_DIR");
const db = drizzle(getEnv("DB_FILE_NAME"));
const app = fastify({ logger: true, querystringParser: parseQueryString });

app.setErrorHandler((err, request, reply) => {
  if (err instanceof ZodError) {
    reply
      .status(400)
      .send({ message: "Malformed data", details: err.format() });
  } else if (err instanceof ApplicationError) {
    reply
      .status(err.httpCode)
      .send({ message: err.message, type: err.constructor.name });
  } else {
    request.log.error(err, "Internal Server Error");
    reply.status(500).send({ message: "Internal Server Error" });
  }
});

app.get("/releases", async (request, reply) => {
  const releaseParam = mapOptional(getQueryParam(request, "release"), (it) =>
    parseInt(it)
  );
  const release = z
    .number()
    .gte(1)
    .max(Number.MAX_SAFE_INTEGER)
    .default(1)
    .parse(releaseParam);
  const outdatedFilesSinceRelease = await getReleasesSince(db, release);
  reply.send(outdatedFilesSinceRelease);
});

app.post("/releases", async (req, reply) => {
  const trackedFiles = await getTrackedFiles(db);
  const trackedFilesLookup = new Map(
    trackedFiles.map((file) => [file.path, file.sha1])
  );
  const changes = await scanChanges(rootDir, trackedFilesLookup);

  const addedFiles = Array.from(changes.entries()).map(([filePath, sha1]) => {
    return { path: filePath, sha1 };
  });
  addedFiles.forEach((addedFile) =>
    req.log.info(addedFile, "Found file change")
  );

  if (addedFiles.length > 0) {
    const release = await createRelease(db, { files: addedFiles });
    await reply.send(release);
  } else {
    reply.send({  })
  }
});

app.get("/files", async (req, reply) => {
  const fileSearchParam = getQueryParam(req, "file");
  const filePathSchema = z.string().refine(
    (path) => {
      try {
        const resolvedPath = join(rootDir, path);
        return resolvedPath.startsWith(rootDir);
      } catch {
        return false;
      }
    },
    {
      message: "Invalid file path",
    }
  );
  const filePath = filePathSchema.parse(fileSearchParam);
});

app.listen({
  port:
    mapOptional(process.env["RELEASE_MANAGER_PORT"], (it) => parseInt(it)) ??
    7313,
});
