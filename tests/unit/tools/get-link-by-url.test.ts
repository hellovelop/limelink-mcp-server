import { describe, it, expect } from "vitest";
import { extractSuffix, registerGetLinkByUrl } from "../../../src/tools/get-link-by-url.js";
import {
  createMockMcpServer,
  createMockApiClient,
  createMockConfig,
  createMockConfigWithoutProjectId,
  createMockConfigWithoutApiKey,
  extractToolHandler,
} from "../../mocks/server.js";

describe("extractSuffix", () => {
  describe("Free plan URL (deep.limelink.org)", () => {
    it("단순 suffix를 추출한다", () => {
      expect(extractSuffix("https://deep.limelink.org/my-link")).toBe("my-link");
    });

    it("중첩 경로 suffix를 추출한다", () => {
      expect(extractSuffix("https://deep.limelink.org/path/nested")).toBe(
        "path/nested"
      );
    });

    it("루트 경로는 null을 반환한다 (빈 suffix)", () => {
      expect(extractSuffix("https://deep.limelink.org/")).toBeNull();
    });

    it("경로 없는 URL은 null을 반환한다", () => {
      expect(extractSuffix("https://deep.limelink.org")).toBeNull();
    });

    it("쿼리 파라미터는 suffix에 포함하지 않는다", () => {
      expect(extractSuffix("https://deep.limelink.org/link?ref=test")).toBe(
        "link"
      );
    });
  });

  describe("Pro plan URL ({project}.limelink.org)", () => {
    it("/link/{suffix} 패턴에서 suffix를 추출한다", () => {
      expect(
        extractSuffix("https://myproject.limelink.org/link/promo")
      ).toBe("promo");
    });

    it("중첩 suffix를 추출한다", () => {
      expect(
        extractSuffix("https://myproject.limelink.org/link/a/b")
      ).toBe("a/b");
    });

    it("/link/ 뒤에 suffix가 없으면 null을 반환한다", () => {
      expect(
        extractSuffix("https://myproject.limelink.org/link/")
      ).toBeNull();
    });

    it("/link 패턴이 아니면 null을 반환한다", () => {
      expect(
        extractSuffix("https://myproject.limelink.org/other/path")
      ).toBeNull();
    });

    it("루트 경로는 null을 반환한다", () => {
      expect(
        extractSuffix("https://myproject.limelink.org/")
      ).toBeNull();
    });
  });

  describe("잘못된 URL", () => {
    it("limelink이 아닌 도메인은 null을 반환한다", () => {
      expect(extractSuffix("https://example.com/link/test")).toBeNull();
    });

    it("유효하지 않은 URL은 null을 반환한다", () => {
      expect(extractSuffix("not-a-url")).toBeNull();
    });

    it("빈 문자열은 null을 반환한다", () => {
      expect(extractSuffix("")).toBeNull();
    });

    it("HTTP 프로토콜도 동작한다", () => {
      expect(extractSuffix("http://deep.limelink.org/test")).toBe("test");
    });
  });
});

describe("registerGetLinkByUrl (tool handler)", () => {
  describe("API 키 누락", () => {
    it("apiClient가 null이면 API 키 필요 에러를 반환한다", async () => {
      const server = createMockMcpServer();
      const config = createMockConfigWithoutApiKey();
      registerGetLinkByUrl(server as any, null, config);
      const handler = extractToolHandler(server);

      const result = (await handler({
        url: "https://deep.limelink.org/test",
      })) as any;

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("LIMELINK_API_KEY");
    });
  });

  it("URL에서 suffix 추출 실패 시 에러를 반환한다", async () => {
    const server = createMockMcpServer();
    const apiClient = createMockApiClient();
    const config = createMockConfig();

    registerGetLinkByUrl(server as any, apiClient as any, config);
    const handler = extractToolHandler(server);

    const result = (await handler({ url: "https://example.com/test" })) as any;

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Could not extract suffix");
  });

  it("project_id 누락 시 에러를 반환한다", async () => {
    const server = createMockMcpServer();
    const apiClient = createMockApiClient();
    const config = createMockConfigWithoutProjectId();

    registerGetLinkByUrl(server as any, apiClient as any, config);
    const handler = extractToolHandler(server);

    const result = (await handler({
      url: "https://deep.limelink.org/test",
    })) as any;

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("project_id is required");
  });

  it("성공 시 API 결과를 JSON으로 반환한다", async () => {
    const server = createMockMcpServer();
    const apiClient = createMockApiClient();
    const config = createMockConfig();

    apiClient.getLinkBySuffix.mockResolvedValue({ id: "link-1" });

    registerGetLinkByUrl(server as any, apiClient as any, config);
    const handler = extractToolHandler(server);

    const result = (await handler({
      url: "https://deep.limelink.org/my-link",
    })) as any;

    expect(result.isError).toBeUndefined();
    expect(apiClient.getLinkBySuffix).toHaveBeenCalledWith(
      "test-project-id",
      "my-link"
    );
    expect(JSON.parse(result.content[0].text)).toEqual({ id: "link-1" });
  });

  it("API 에러 시 에러 메시지를 반환한다 (message 프로퍼티)", async () => {
    const server = createMockMcpServer();
    const apiClient = createMockApiClient();
    const config = createMockConfig();

    apiClient.getLinkBySuffix.mockRejectedValue({ message: "Not found" });

    registerGetLinkByUrl(server as any, apiClient as any, config);
    const handler = extractToolHandler(server);

    const result = (await handler({
      url: "https://deep.limelink.org/missing",
    })) as any;

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Not found");
  });

  it("message 프로퍼티 없는 에러를 String()으로 포맷한다", async () => {
    const server = createMockMcpServer();
    const apiClient = createMockApiClient();
    const config = createMockConfig();

    apiClient.getLinkBySuffix.mockRejectedValue(42);

    registerGetLinkByUrl(server as any, apiClient as any, config);
    const handler = extractToolHandler(server);

    const result = (await handler({
      url: "https://deep.limelink.org/test-link",
    })) as any;

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("42");
  });
});
