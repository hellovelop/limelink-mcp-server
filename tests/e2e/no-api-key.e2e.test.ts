import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { startServer, type TestServer } from "./helpers/server.js";

describe("E2E: API 키 없이 서버 기동", () => {
  let server: TestServer;

  beforeAll(async () => {
    server = await startServer({
      LIMELINK_API_KEY: "",
      LIMELINK_PROJECT_ID: "test-proj",
    });
  });

  afterAll(async () => {
    await server.cleanup();
  });

  it("API 키 없이도 서버가 정상 기동한다", () => {
    expect(server.client).toBeDefined();
  });

  it("API 키 없이도 도구 목록을 조회할 수 있다", async () => {
    const { tools } = await server.client.listTools();
    expect(tools).toHaveLength(3);
  });

  it("API 키 없이도 리소스 목록을 조회할 수 있다", async () => {
    const { resources } = await server.client.listResources();
    expect(resources.length).toBeGreaterThan(0);
  });

  it("API 키 없이도 프롬프트 목록을 조회할 수 있다", async () => {
    const { prompts } = await server.client.listPrompts();
    expect(prompts).toHaveLength(2);
  });

  describe("API 키 없이 Tool 호출 시 에러", () => {
    it("create-link 호출 시 API 키 필요 에러를 반환한다", async () => {
      const result = await server.client.callTool({
        name: "create-link",
        arguments: {
          dynamic_link_suffix: "test",
          dynamic_link_url: "https://example.com",
          dynamic_link_name: "Test",
        },
      });

      expect(result.isError).toBe(true);
      const text = (result.content as Array<{ type: string; text: string }>)[0].text;
      expect(text).toContain("LIMELINK_API_KEY");
    });

    it("get-link-by-suffix 호출 시 API 키 필요 에러를 반환한다", async () => {
      const result = await server.client.callTool({
        name: "get-link-by-suffix",
        arguments: {
          suffix: "test",
        },
      });

      expect(result.isError).toBe(true);
      const text = (result.content as Array<{ type: string; text: string }>)[0].text;
      expect(text).toContain("LIMELINK_API_KEY");
    });

    it("get-link-by-url 호출 시 API 키 필요 에러를 반환한다", async () => {
      const result = await server.client.callTool({
        name: "get-link-by-url",
        arguments: {
          url: "https://deep.limelink.org/test",
        },
      });

      expect(result.isError).toBe(true);
      const text = (result.content as Array<{ type: string; text: string }>)[0].text;
      expect(text).toContain("LIMELINK_API_KEY");
    });
  });
});
