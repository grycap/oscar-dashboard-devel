import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { File } from "node:buffer";
import invokeServiceSync from "../src/api/invoke/invokeServiceSync.ts";

class TestFileReader {
  onload;
  onerror;
  readAsBinaryString(file) {
    file.arrayBuffer().then((data) => {
      this.onload?.({ target: { result: Buffer.from(data).toString("binary") } });
    }, () => this.onerror?.());
  }
}

globalThis.FileReader = TestFileReader;

test("rejects a missing service name before reading or sending the file", async () => {
  await assert.rejects(
    invokeServiceSync({ serviceName: "", file: null, token: "", endpoint: "http://127.0.0.1:1" }),
    /Service name is required/,
  );
});

test("sends the named service and preserves HTTP error details", async () => {
  const paths = [];
  const server = createServer(async (request, response) => {
    paths.push(request.url);
    const chunks = [];
    for await (const chunk of request) chunks.push(chunk);
    assert.equal(Buffer.concat(chunks).toString(), "aGVsbG8=");
    response.writeHead(404, { "content-type": "application/json" });
    response.end(JSON.stringify({ message: "Service not found" }));
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    const { port } = server.address();
    await assert.rejects(
      invokeServiceSync({
        serviceName: "ai4eosc-yolo-local",
        file: new File(["hello"], "input.json"),
        token: "test-token",
        endpoint: `http://127.0.0.1:${port}`,
      }),
      /HTTP 404: Service not found/,
    );
    assert.deepEqual(paths, ["/run/ai4eosc-yolo-local"]);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
