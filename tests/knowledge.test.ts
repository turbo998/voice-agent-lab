import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { knowledge } from "../packages/business-core/fixtures.js";

test("published knowledge preserves every exact synthetic fixture and Kxx anchor", async () => {
  const document = (await readFile(new URL("../docs/knowledge.md", import.meta.url), "utf8")).replace(/\r\n/g, "\n");
  assert.equal(knowledge.length, 12);
  for (const entry of knowledge) {
    assert.ok(document.includes(`## ${entry.id}\n`), `Missing ${entry.id} anchor`);
    assert.ok(document.includes(entry.text), `Drifted ${entry.id} content`);
  }
});
