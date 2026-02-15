import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { startServer, type TestServer } from "./helpers/server.js";

describe("E2E: Resources", () => {
  let server: TestServer;

  beforeAll(async () => {
    server = await startServer();
  });

  afterAll(async () => {
    await server.cleanup();
  });

  describe("리소스 목록", () => {
    it("docs-index 정적 리소스가 등록되어 있다", async () => {
      const { resources } = await server.client.listResources();

      const index = resources.find((r) => r.uri === "limelink://docs/index");
      expect(index).toBeDefined();
      expect(index!.name).toBeTruthy();
    });
  });

  describe("리소스 템플릿", () => {
    it("docs-page 템플릿이 등록되어 있다", async () => {
      const { resourceTemplates } =
        await server.client.listResourceTemplates();

      const docsTemplate = resourceTemplates.find(
        (t) => t.uriTemplate === "limelink://docs/{slug}"
      );
      expect(docsTemplate).toBeDefined();
    });
  });

  describe("docs/index 읽기", () => {
    it("llms.txt 내용을 반환한다", async () => {
      const result = await server.client.readResource({
        uri: "limelink://docs/index",
      });

      expect(result.contents).toHaveLength(1);
      expect(result.contents[0].uri).toBe("limelink://docs/index");

      const text = result.contents[0].text as string;
      // llms.txt는 LimeLink 관련 내용을 포함해야 한다
      expect(text.length).toBeGreaterThan(0);
      expect(text.toLowerCase()).toContain("limelink");
    });
  });

  describe("docs/{slug} 읽기", () => {
    it("유효한 slug로 마크다운 문서를 반환한다", async () => {
      const result = await server.client.readResource({
        uri: "limelink://docs/introduction",
      });

      expect(result.contents).toHaveLength(1);
      expect(result.contents[0].uri).toBe("limelink://docs/introduction");

      const text = result.contents[0].text as string;
      expect(text.length).toBeGreaterThan(0);
    });

    it("무효한 slug는 에러를 던진다", async () => {
      await expect(
        server.client.readResource({
          uri: "limelink://docs/nonexistent-page",
        })
      ).rejects.toThrow();
    });
  });
});
