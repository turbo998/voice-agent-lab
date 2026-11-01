import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const files = [...new Set(execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard", "-z"], {
  encoding: "utf8",
}).split("\0").filter(Boolean))];
const prohibitedPaths = /(^|\/)(node_modules|dist|\.private|\.scratch|recordings|\.copilot-tracking)(\/|$)|(^|\/)(settings\.json|\.env(?:\..*)?|.*\.(?:log|mp4|webm|pem|pfx|dpapi))$/i;
const rules = [
  ["private machine path", /(?:[A-Z]:[\\/]Users[\\/]|[A-Z]:\\\\Users\\\\)[^\s"'<>]+/i],
  ["GitHub credential", /\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,})\b/],
  ["private key", /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----\r?\n[A-Za-z0-9+/]{20,}/],
  ["signed URL", /[?&](?:sig|signature|access_token|api_key|token)=[A-Za-z0-9%+/_=-]{16,}/i],
  ["literal Azure account scope", /\/subscriptions\/[0-9a-f]{8}-[0-9a-f-]{27,}/i],
  ["literal tenant", /(?:tenantId|tenant_id|AZURE_TENANT_ID)\s*[:=]\s*["']?[0-9a-f]{8}-[0-9a-f-]{27,}/i],
  ["Retell credential", /\bkey_[A-Za-z0-9]{25,}\b/],
];
const reviewedImages = new Set([
  "experiments/gpt-live/docs/images/interface-en.png",
  "experiments/gpt-live/docs/images/interface-zh-CN.png",
  "docs/assets/synthetic-ops.png",
  "docs/assets/architecture.png",
]);
const failures = [];
for (const path of files) {
  if (prohibitedPaths.test(path) && !/(^|\/)\.env\.example$/.test(path)) {
    failures.push({ path, reason: "private/runtime artifact" });
    continue;
  }
  const bytes = await readFile(resolve(path));
  if (bytes.length > 4 * 1024 * 1024) {
    failures.push({ path, reason: "file exceeds publication review bound" });
    continue;
  }
  if (bytes.includes(0)) {
    if (!reviewedImages.has(path) || !bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
      failures.push({ path, reason: "binary artifact requires explicit review" });
    }
    continue;
  }
  const text = bytes.toString("utf8");
  for (const [reason, rule] of rules) {
    const match = rule.exec(text);
    if (match) failures.push({ path, reason, line: text.slice(0, match.index).split("\n").length });
  }
}
if (failures.length) {
  console.error(JSON.stringify({ publication: "blocked", findings: failures }, null, 2));
  process.exitCode = 1;
} else {
  console.log(JSON.stringify({ publication: "static_scan_passed", files: files.length,
    note: "Not a guarantee against all secrets; review staged diff and media before publishing." }));
}
