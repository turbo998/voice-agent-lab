import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { access, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const revision = "a33041496fb1f54dbc1673b74d1fb8957e6ce7fb";
const repository = "turbo998/gpt-live-1-demo";
const root = join(process.cwd(), "experiments", "gpt-live");
try {
  await access(join(root, "PROVENANCE.json"));
  throw new Error("Imported baseline already exists; refusing to overwrite lab customizations.");
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
const tree = JSON.parse(execFileSync("gh", ["api", `repos/${repository}/git/trees/${revision}?recursive=1`], { encoding: "utf8" }));
const excluded = /(^\.github\/|(^|\/)(settings\.json|\.env|data|logs|recordings|node_modules)(\/|$))/;
const files = tree.tree.filter((entry) => entry.type === "blob" && !excluded.test(entry.path));
for (const file of files) {
  if (file.path.includes("..") || file.path.startsWith("/")) throw new Error("Unsafe tracked path");
  let blob;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      blob = JSON.parse(execFileSync("gh", ["api", `repos/${repository}/git/blobs/${file.sha}`], { encoding: "utf8", timeout: 60000 }));
      break;
    } catch (error) {
      if (attempt === 2) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }
  if (!blob || blob.encoding !== "base64") throw new Error(`Unsupported public blob: ${file.path}`);
  const content = Buffer.from(blob.content, "base64");
  const digest = createHash("sha1").update(`blob ${content.length}\0`).update(content).digest("hex");
  if (digest !== file.sha) throw new Error(`Git blob integrity mismatch: ${file.path}`);
  const target = join(root, ...file.path.split("/"));
  await mkdir(join(target, ".."), { recursive: true });
  await writeFile(target, content);
}
await writeFile(join(root, "PROVENANCE.json"), JSON.stringify({
  repository: `https://github.com/${repository}`,
  upstream: "https://github.com/kylefu8/gpt-live-1-demo",
  revision, license: "MIT", baselineVersion: "0.3.1",
  excluded: [".github workflows", ".env", "settings.json", "data", "logs", "recordings", "node_modules"],
  importedFiles: files.map(({ path, sha }) => ({ path, gitBlob: sha })),
}, null, 2) + "\n");
console.log(`Imported ${files.length} tracked public files at ${revision}; original checkouts untouched.`);
