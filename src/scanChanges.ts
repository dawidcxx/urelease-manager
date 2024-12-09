import { computeSHA1, walkDir } from "./util";
import { relative } from "node:path";

// filepath -> sha1
type TrackedFilesLookup = Map<string, string>;

export async function scanChanges(
  rootDir: string,
  trackedFilesLookup: TrackedFilesLookup
): Promise<Map<string, string>> {
  const changes: Map<string, string> = new Map();

  for await (const fsPath of walkDir(rootDir)) {
    const sha1 = await computeSHA1(fsPath);
    const pathKey = relative(rootDir, fsPath);
    // if different hash or has been added
    if (sha1 !== trackedFilesLookup.get(pathKey)) {
      changes.set(pathKey, sha1);
    }
  }

  return changes;
}
