import test from "node:test";
import assert from "node:assert/strict";
import { File } from "node:buffer";
import { buildAI4EOSCInput } from "../src/lib/ai4eoscInvoke.ts";

globalThis.File = File;

test("encodes image bytes inside an AI4EOSC JSON input", async () => {
  const source = new File([Uint8Array.from([0, 255, 3])], "plant.JPG", { type: "image/jpeg" });
  const result = await buildAI4EOSCInput(source, "files", '{"threshold": 0.5}');
  assert.equal(result.name, "ai4eosc-input.json");
  assert.equal(result.type, "application/json");
  assert.deepEqual(JSON.parse(await result.text()), {
    threshold: 0.5,
    "oscar-files": [{ key: "files", file_format: "jpg", data: "AP8D" }],
  });
});

test("allows help without a file", async () => {
  const result = await buildAI4EOSCInput(null, "files", '{"help":""}');
  assert.deepEqual(JSON.parse(await result.text()), { help: "" });
});

test("rejects malformed or ambiguous input", async () => {
  await assert.rejects(buildAI4EOSCInput(null, "files", "{}"), /Select a file/);
  await assert.rejects(buildAI4EOSCInput(null, "files", "[1]"), /JSON object/);
  await assert.rejects(buildAI4EOSCInput(null, "files", "not-json"), /valid JSON/);
  await assert.rejects(buildAI4EOSCInput(new File(["x"], "a.png"), "", "{}"), /file parameter/);
  await assert.rejects(buildAI4EOSCInput(new File(["x"], "no-extension"), "files", "{}"), /extension/);
  await assert.rejects(buildAI4EOSCInput(null, "files", '{"oscar-files":[]}'), /Raw file/);
  await assert.rejects(buildAI4EOSCInput(null, "files", '{"values":[1,2]}'), /encode arrays\/objects as strings/);
});
