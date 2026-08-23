import { readFileSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { startServer, type TestServer } from "./helpers/server.js";

const { version } = JSON.parse(
  readFileSync(new URL("../../package.json", import.meta.url), "utf-8")
) as { version: string };

describe("E2E: runtime metadata", () => {
  let cwd: string;
  let server: TestServer;

  beforeAll(async () => {
    cwd = await mkdtemp(join(tmpdir(), "limelink-mcp-e2e-"));
    server = await startServer({}, cwd);
  });

  afterAll(async () => {
    await server?.cleanup();
    await rm(cwd, { recursive: true, force: true });
  });

  it("패키지 외부 working directory에서도 자체 버전으로 기동한다", () => {
    expect(server.client.getServerVersion()).toEqual({
      name: "limelink",
      version,
    });
  });
});
