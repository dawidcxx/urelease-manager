import { computeSHA1, walkDir } from "./util";

 // filepath -> sha1
type TrackedFilesLookup = Map<string, string>;

export async function scanChanges(
  rootDir: string,
  trackedFilesLookup: TrackedFilesLookup
): Promise<Map<string, string>> {
  const changes: Map<string, string> = new Map();

  for await (const path of walkDir(rootDir)) {
    const sha1 = await computeSHA1(path);
    // if different hash or has been added
    if (sha1 !== trackedFilesLookup.get(path)) {
      changes.set(path, sha1);
    }
  }

  return changes;
}


