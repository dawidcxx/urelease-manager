import fs from "node:fs/promises";
import { join, resolve } from "node:path";
import { readFile } from "fs/promises";
import { createHash } from "node:crypto";
import type { FastifyRequest } from "fastify";
import { createReadStream } from "node:fs";
import { z } from "zod";

export function mapOptional<T, U>(
  value: T | undefined | null,
  fn: (value: T) => U
): U | undefined {
  return value ? fn(value) : undefined;
}

export async function* walkDir(dir: string): AsyncGenerator<string> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walkDir(fullPath);
    } else if (entry.isFile()) {
      yield fullPath
    }
  }
}

export function computeSHA1(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = createHash("sha1");
    const stream = createReadStream(filePath);
    stream.on("data", (chunk) => hash.update(chunk as string));
    stream.on("end", () => resolve(hash.digest("hex")));
    stream.on("error", (err) => reject(err));
  });
}

export function parseQueryString(queryString: string): Record<string, string> {
  const urlSearchParams = new URLSearchParams(queryString);
  const obj: Record<string, string> = {};
  for (const [key, value] of urlSearchParams.entries()) {
    obj[key] = value;
  }
  return obj;
}

export function getQueryParam(req: FastifyRequest, key: string) {
  const query = req.query as Record<string, string | undefined>;
  const value = query[key];
  if (!isNil(value)) {
    return value;
  } else {
    return null;
  }
}

export function isNil(value: any): value is null | undefined {
  return value === null || value === undefined;
}

export function getEnv(
  envKey: string,
  options?: { optional: boolean }
): string {
  const envVal = process.env[envKey];
  if (isNil(envVal) && options?.optional !== true) {
    throw new Error(`Missing required env variable: '${envKey}'`);
  }
  return envVal ?? "";
}

export const PathValidatorSchema = (root: string) => z.string().refine(
  (path) => {
    try {
      const resolvedPath = resolve(join(root, path));
      return resolvedPath.startsWith(resolve(root));
    } catch {
      return false;
    }
  },
  {
    message: "Invalid file path",
  }
)