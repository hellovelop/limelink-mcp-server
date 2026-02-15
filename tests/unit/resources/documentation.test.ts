import { describe, it, expect, vi } from "vitest";
import { registerDocResources } from "../../../src/resources/documentation.js";
import { getValidSlugs } from "../../../src/lib/doc-fetcher.js";
import { createMockMcpServer } from "../../mocks/server.js";

function createMockDocFetcher() {
  return {
    fetchIndex: vi.fn(),
    fetchDoc: vi.fn(),
  };
}

describe("registerDocResources", () => {
  it("2개의 리소스를 등록한다 (index + page template)", () => {
    const server = createMockMcpServer();
    const docFetcher = createMockDocFetcher();

    registerDocResources(server as any, docFetcher as any);

    expect(server.resource).toHaveBeenCalledTimes(2);
  });

  describe("docs-index 리소스", () => {
    it("올바른 URI로 등록된다", () => {
      const server = createMockMcpServer();
      const docFetcher = createMockDocFetcher();

      registerDocResources(server as any, docFetcher as any);

      const firstCall = server.resource.mock.calls[0];
      expect(firstCall[0]).toBe("docs-index");
      expect(firstCall[1]).toBe("limelink://docs/index");
    });

    it("핸들러가 fetchIndex를 호출하고 결과를 반환한다", async () => {
      const server = createMockMcpServer();
      const docFetcher = createMockDocFetcher();
      docFetcher.fetchIndex.mockResolvedValue("# LimeLink\n...");

      registerDocResources(server as any, docFetcher as any);

      const handler = server.resource.mock.calls[0][3]; // 4번째 인자 = handler
      const uri = new URL("limelink://docs/index");
      const result = await handler(uri);

      expect(docFetcher.fetchIndex).toHaveBeenCalled();
      expect(result.contents).toHaveLength(1);
      expect(result.contents[0].text).toBe("# LimeLink\n...");
      expect(result.contents[0].mimeType).toBe("text/plain");
    });
  });

  describe("docs-page 리소스 템플릿", () => {
    it("ResourceTemplate으로 등록된다", () => {
      const server = createMockMcpServer();
      const docFetcher = createMockDocFetcher();

      registerDocResources(server as any, docFetcher as any);

      const secondCall = server.resource.mock.calls[1];
      expect(secondCall[0]).toBe("docs-page");
      // 2번째 인자는 ResourceTemplate 인스턴스
      expect(secondCall[1]).toBeDefined();
    });

    it("핸들러가 유효한 slug에 대해 fetchDoc을 호출한다", async () => {
      const server = createMockMcpServer();
      const docFetcher = createMockDocFetcher();
      docFetcher.fetchDoc.mockResolvedValue("# Getting Started\n...");

      registerDocResources(server as any, docFetcher as any);

      const handler = server.resource.mock.calls[1][3]; // 4번째 인자 = handler
      const uri = new URL("limelink://docs/getting-started");
      const result = await handler(uri, { slug: "getting-started" });

      expect(docFetcher.fetchDoc).toHaveBeenCalledWith("getting-started");
      expect(result.contents[0].text).toBe("# Getting Started\n...");
      expect(result.contents[0].mimeType).toBe("text/markdown");
    });

    it("무효한 slug에 대해 에러를 던진다", async () => {
      const server = createMockMcpServer();
      const docFetcher = createMockDocFetcher();

      registerDocResources(server as any, docFetcher as any);

      const handler = server.resource.mock.calls[1][3];
      const uri = new URL("limelink://docs/invalid-slug");

      await expect(
        handler(uri, { slug: "invalid-slug" })
      ).rejects.toThrow('Invalid documentation slug: "invalid-slug"');
    });

    it("에러 메시지에 유효한 slug 목록을 포함한다", async () => {
      const server = createMockMcpServer();
      const docFetcher = createMockDocFetcher();

      registerDocResources(server as any, docFetcher as any);

      const handler = server.resource.mock.calls[1][3];
      const uri = new URL("limelink://docs/bad");

      await expect(handler(uri, { slug: "bad" })).rejects.toThrow(
        "introduction"
      );
    });

    it("list 콜백이 모든 유효 slug에 대한 리소스 목록을 반환한다", async () => {
      const server = createMockMcpServer();
      const docFetcher = createMockDocFetcher();

      registerDocResources(server as any, docFetcher as any);

      const template = server.resource.mock.calls[1][1];
      const slugs = getValidSlugs();

      // ResourceTemplate의 _callbacks.list를 직접 호출하여 list 콜백 커버
      const listCallback = (template as any)._callbacks.list;
      expect(listCallback).toBeDefined();

      const listResult = await listCallback();
      expect(listResult.resources).toHaveLength(slugs.length);

      // 각 리소스의 URI 형식 검증
      for (const slug of slugs) {
        const found = listResult.resources.find(
          (r: any) => r.uri === `limelink://docs/${slug}`
        );
        expect(found).toBeDefined();
        expect(found.name).toBe(`Limelink Docs: ${slug}`);
        expect(found.mimeType).toBe("text/markdown");
      }
    });
  });
});
