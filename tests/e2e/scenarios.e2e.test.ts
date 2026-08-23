import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { startServer, type TestServer } from "./helpers/server.js";

/**
 * 공개 MCP 기능의 실제 사용 흐름을 검증한다.
 *
 * 1. API 키 없이 원격 LimeLink 문서를 탐색한다.
 * 2. 문서에서 파악한 입력으로 링크 생성/조회 도구를 사용한다.
 * 3. 서버가 도구 3종과 문서 리소스 2종만 노출하는지 확인한다.
 */
describe("E2E: MCP 사용 시나리오", () => {
  describe("시나리오 1: 문서 탐색 플로우", () => {
    let server: TestServer;

    beforeAll(async () => {
      server = await startServer();
    });

    afterAll(async () => {
      await server.cleanup();
    });

    it("문서 인덱스와 15개 문서 페이지를 탐색한다", async () => {
      const index = await server.client.readResource({
        uri: "limelink://docs/index",
      });
      expect(index.contents[0].mimeType).toBe("text/plain");
      expect((index.contents[0].text as string).length).toBeGreaterThan(100);

      const { resources } = await server.client.listResources();
      const uris = resources.map((resource) => resource.uri);
      expect(uris).toContain("limelink://docs/index");
      expect(uris).toContain("limelink://docs/sdk-integration");
      expect(uris).toContain("limelink://docs/ios-sdk");
      expect(uris).toContain("limelink://docs/android-sdk");
      expect(uris).toContain("limelink://docs/create-link");
      expect(uris.filter((uri) => uri.startsWith("limelink://docs/"))).toHaveLength(16);
    });

    it("SDK와 링크 생성 문서를 직접 읽는다", async () => {
      for (const slug of ["sdk-integration", "ios-sdk", "android-sdk", "create-link"]) {
        const result = await server.client.readResource({
          uri: `limelink://docs/${slug}`,
        });
        expect(result.contents[0].mimeType).toBe("text/markdown");
        expect((result.contents[0].text as string).length).toBeGreaterThan(0);
      }
    });

    it("문서 리소스 템플릿을 노출한다", async () => {
      const { resourceTemplates } = await server.client.listResourceTemplates();
      expect(resourceTemplates).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ uriTemplate: "limelink://docs/{slug}" }),
        ])
      );
    });
  });

  describe("시나리오 2: 문서에서 도구로 이어지는 흐름", () => {
    let server: TestServer;

    beforeAll(async () => {
      server = await startServer({
        LIMELINK_API_KEY: "",
        LIMELINK_PROJECT_ID: "e2e-project",
      });
    });

    afterAll(async () => {
      await server.cleanup();
    });

    it("링크 생성 문서를 읽은 뒤 create-link 입력 스키마를 확인한다", async () => {
      const doc = await server.client.readResource({
        uri: "limelink://docs/create-link",
      });
      expect((doc.contents[0].text as string).length).toBeGreaterThan(0);

      const { tools } = await server.client.listTools();
      const tool = tools.find((candidate) => candidate.name === "create-link");
      expect(tool).toBeDefined();
      expect(tool!.inputSchema.required).toEqual(
        expect.arrayContaining([
          "project",
          "dynamic_link_url",
          "dynamic_link_name",
        ])
      );
      expect(tool!.inputSchema.properties).toHaveProperty("apple_options");
      expect(tool!.inputSchema.properties).toHaveProperty("android_options");
      expect(tool!.inputSchema.properties).toHaveProperty("additional_options");
    });

    it("API 키가 없으면 문서 조회 후 도구가 명확한 인증 오류를 반환한다", async () => {
      const doc = await server.client.readResource({
        uri: "limelink://docs/api-integration",
      });
      expect((doc.contents[0].text as string).length).toBeGreaterThan(0);

      const result = await server.client.callTool({
        name: "create-link",
        arguments: {
          dynamic_link_suffix: "product-1",
          dynamic_link_url: "https://example.com/product/1",
          dynamic_link_name: "Product 1",
          project: "11111111-1111-4111-8111-111111111111",
        },
      });
      expect(result.isError).toBe(true);
      expect((result.content as Array<{ text: string }>)[0].text).toContain(
        "LIMELINK_PROFILES_FILE"
      );
    });

    it("URL 조회 도구는 full URL만 요구하고 Project selector를 요구하지 않는다", async () => {
      const { tools } = await server.client.listTools();
      const tool = tools.find((candidate) => candidate.name === "get-link-by-url");
      expect(tool).toBeDefined();
      expect(tool!.inputSchema.required).toEqual(["url"]);
      expect(tool!.inputSchema.properties).toHaveProperty("profile");
      expect(tool!.inputSchema.properties).not.toHaveProperty("project");
    });
  });

  describe("시나리오 3: 공개 기능 종합 검증", () => {
    let server: TestServer;

    beforeAll(async () => {
      server = await startServer();
    });

    afterAll(async () => {
      await server.cleanup();
    });

    it("도구 6종과 문서 리소스만 등록하고 프롬프트는 등록하지 않는다", async () => {
      const [toolsResult, resourcesResult, templatesResult] =
        await Promise.all([
          server.client.listTools(),
          server.client.listResources(),
          server.client.listResourceTemplates(),
        ]);

      expect(toolsResult.tools.map((tool) => tool.name).sort()).toEqual([
        "create-link",
        "get-link-by-suffix",
        "get-link-by-url",
        "list-custom-domains",
        "list-profiles",
        "list-projects",
      ]);
      expect(resourcesResult.resources.some(
        (resource) => resource.uri === "limelink://docs/index"
      )).toBe(true);
      expect(templatesResult.resourceTemplates.some(
        (template) => template.uriTemplate === "limelink://docs/{slug}"
      )).toBe(true);
      await expect(server.client.listPrompts()).rejects.toThrow("Method not found");
    });

    it("존재하지 않는 문서 slug는 오류를 반환한다", async () => {
      await expect(
        server.client.readResource({ uri: "limelink://docs/not-found" })
      ).rejects.toThrow();
    });
  });
});
