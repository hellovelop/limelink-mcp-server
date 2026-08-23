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
    it("6개의 도구가 등록되어 있다", async () => {
      const { tools } = await server.client.listTools();

      expect(tools).toHaveLength(6);

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

  describe("get-link-by-url 입력 계약", () => {
    it("URL만 필수이고 Project selector를 노출하지 않는다", async () => {
      const { tools } = await server.client.listTools();
      const tool = tools.find((candidate) => candidate.name === "get-link-by-url");
      expect(tool?.inputSchema.required).toEqual(["url"]);
      expect(tool?.inputSchema.properties).not.toHaveProperty("project");
    });

    it("HTTP URL을 tool input validation에서 거부한다", async () => {
      const result = await server.client.callTool({
        name: "get-link-by-url",
        arguments: { url: "http://deep.limelink.org/campaign" },
      });
      expect(result.isError).toBe(true);
      expect((result.content as Array<{ text: string }>)[0].text).toContain(
        "URL must use HTTPS"
      );
    });
  });
});
