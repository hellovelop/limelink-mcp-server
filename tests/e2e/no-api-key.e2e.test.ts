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
    expect(tools).toHaveLength(6);
  });

  it("API 키 없이도 리소스 목록을 조회할 수 있다", async () => {
    const { resources } = await server.client.listResources();
    expect(resources.length).toBeGreaterThan(0);
  });

  it("프롬프트 기능을 노출하지 않는다", async () => {
    await expect(server.client.listPrompts()).rejects.toThrow("Method not found");
  });

  describe("API 키 없이 Tool 호출 시 에러", () => {
    const expectCredentialGuide = (result: Awaited<ReturnType<typeof server.client.callTool>>) => {
      expect(result.isError).toBe(true);
      const text = (result.content as Array<{ type: string; text: string }>)[0].text;
      expect(text).toContain("https://limelink.org/organizations");
      expect(text).toContain("Organization API key");
      expect(text).toContain("LIMELINK_PROFILES_FILE");
    };

    it("create-link 호출 시 API key 발급 경로를 안내한다", async () => {
      const result = await server.client.callTool({
        name: "create-link",
        arguments: {
          dynamic_link_url: "https://example.com",
          dynamic_link_name: "Test",
          project: "11111111-1111-4111-8111-111111111111",
        },
      });
      expectCredentialGuide(result);
    });

    it("get-link-by-suffix 호출 시 API key 발급 경로를 안내한다", async () => {
      const result = await server.client.callTool({
        name: "get-link-by-suffix",
        arguments: { suffix: "test", project: "11111111-1111-4111-8111-111111111111" },
      });
      expectCredentialGuide(result);
    });

    it("get-link-by-url 호출 시 API key 발급 경로를 안내한다", async () => {
      const result = await server.client.callTool({
        name: "get-link-by-url",
        arguments: { url: "https://deep.limelink.org/test" },
      });
      expectCredentialGuide(result);
    });
  });
});
