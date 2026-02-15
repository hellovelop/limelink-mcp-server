import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  DocFetcher,
  isValidSlug,
  getValidSlugs,
} from "../../../src/lib/doc-fetcher.js";
import { mockFetch, createTextResponse, createErrorResponse } from "../../mocks/fetch.js";

describe("isValidSlug", () => {
  it("유효한 slug를 true로 판별한다", () => {
    const validSlugs = [
      "introduction",
      "getting-started",
      "project",
      "application",
      "dynamic-link",
      "create-link",
      "link-detail",
      "link-management",
      "appearance",
      "sdk-integration",
      "ios-sdk",
      "android-sdk",
      "api-integration",
      "advanced",
      "llm-agent",
    ];

    for (const slug of validSlugs) {
      expect(isValidSlug(slug)).toBe(true);
    }
  });

  it("무효한 slug를 false로 판별한다", () => {
    expect(isValidSlug("invalid")).toBe(false);
    expect(isValidSlug("")).toBe(false);
    expect(isValidSlug("INTRODUCTION")).toBe(false);
    expect(isValidSlug("introduction ")).toBe(false);
    expect(isValidSlug("some-random-slug")).toBe(false);
  });
});

describe("getValidSlugs", () => {
  it("15개의 slug를 반환한다", () => {
    const slugs = getValidSlugs();
    expect(slugs).toHaveLength(15);
  });

  it("readonly 배열을 반환한다", () => {
    const slugs = getValidSlugs();
    expect(Array.isArray(slugs)).toBe(true);
  });
});

describe("DocFetcher", () => {
  let fetchMock: ReturnType<typeof mockFetch>;
  let fetcher: DocFetcher;

  beforeEach(() => {
    fetchMock = mockFetch();
    fetcher = new DocFetcher();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("fetchIndex", () => {
    it("상수 DOCS_BASE_URL/llms.txt를 fetch한다", async () => {
      fetchMock.mockResolvedValue(createTextResponse("# LimeLink Docs\n..."));

      const result = await fetcher.fetchIndex();

      expect(fetchMock).toHaveBeenCalledWith("https://limelink.org/llms.txt");
      expect(result).toBe("# LimeLink Docs\n...");
    });

    it("두 번째 호출 시 캐시에서 반환한다 (fetch 1회만 호출)", async () => {
      fetchMock.mockResolvedValue(createTextResponse("cached content"));

      await fetcher.fetchIndex();
      const result = await fetcher.fetchIndex();

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(result).toBe("cached content");
    });

    it("fetch 실패 시 에러를 던진다", async () => {
      fetchMock.mockResolvedValue(
        createErrorResponse(404, undefined, "Not Found")
      );

      await expect(fetcher.fetchIndex()).rejects.toThrow(
        "Failed to fetch llms.txt: HTTP 404"
      );
    });
  });

  describe("fetchDoc", () => {
    it("상수 DOCS_BASE_URL/md/{slug}.md를 fetch한다", async () => {
      fetchMock.mockResolvedValue(createTextResponse("# Introduction\n..."));

      const result = await fetcher.fetchDoc("introduction");

      expect(fetchMock).toHaveBeenCalledWith(
        "https://limelink.org/md/introduction.md"
      );
      expect(result).toBe("# Introduction\n...");
    });

    it("캐시 키로 doc:{slug} 형태를 사용한다", async () => {
      fetchMock.mockResolvedValue(createTextResponse("doc content"));

      await fetcher.fetchDoc("ios-sdk");
      await fetcher.fetchDoc("ios-sdk");

      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("다른 slug는 별도로 fetch한다", async () => {
      fetchMock.mockResolvedValue(createTextResponse("content"));

      await fetcher.fetchDoc("ios-sdk");
      await fetcher.fetchDoc("android-sdk");

      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it("fetch 실패 시 에러를 던진다", async () => {
      fetchMock.mockResolvedValue(
        createErrorResponse(500, undefined, "Server Error")
      );

      await expect(fetcher.fetchDoc("advanced")).rejects.toThrow(
        "Failed to fetch document 'advanced': HTTP 500"
      );
    });
  });
});
