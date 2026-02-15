import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { startServer, type TestServer } from "./helpers/server.js";

describe("E2E: Tools", () => {
  let server: TestServer;

  beforeAll(async () => {
    server = await startServer({
      LIMELINK_PROJECT_ID: "e2e-project-id",
    });
  });

  afterAll(async () => {
    await server.cleanup();
  });

  describe("도구 목록", () => {
    it("3개의 도구가 등록되어 있다", async () => {
      const { tools } = await server.client.listTools();

      expect(tools).toHaveLength(3);

      const names = tools.map((t) => t.name);
      expect(names).toContain("create-link");
      expect(names).toContain("get-link-by-suffix");
      expect(names).toContain("get-link-by-url");
    });

    it("각 도구에 설명이 있다", async () => {
      const { tools } = await server.client.listTools();

      for (const tool of tools) {
        expect(tool.description).toBeTruthy();
        expect(tool.description!.length).toBeGreaterThan(10);
      }
    });

    it("각 도구에 inputSchema가 정의되어 있다", async () => {
      const { tools } = await server.client.listTools();

      for (const tool of tools) {
        expect(tool.inputSchema).toBeDefined();
        expect(tool.inputSchema.type).toBe("object");
      }
    });
  });

  describe("get-link-by-url 에러 케이스", () => {
    it("limelink이 아닌 URL은 에러를 반환한다", async () => {
      const result = await server.client.callTool({
        name: "get-link-by-url",
        arguments: {
          url: "https://example.com/test",
        },
      });

      expect(result.isError).toBe(true);
      const text = (result.content as Array<{ type: string; text: string }>)[0]
        .text;
      expect(text).toContain("Could not extract suffix");
    });
  });
});
