import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ApiClient } from "../../../src/lib/api-client.js";
import {
  mockFetch,
  createMockResponse,
  createErrorResponse,
} from "../../mocks/fetch.js";

describe("ApiClient", () => {
  let fetchMock: ReturnType<typeof mockFetch>;
  let client: ApiClient;

  beforeEach(() => {
    fetchMock = mockFetch();
    client = new ApiClient("test-api-key");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("공통 동작", () => {
    it("요청에 올바른 헤더를 포함한다", async () => {
      fetchMock.mockResolvedValue(createMockResponse({}));

      await client.createLink({ test: true });

      expect(fetchMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: {
            "X-API-KEY": "test-api-key",
            "Content-Type": "application/json",
          },
        })
      );
    });

    it("상수 API_BASE_URL을 사용한다", async () => {
      fetchMock.mockResolvedValue(createMockResponse({}));

      await client.createLink({});

      const calledUrl = fetchMock.mock.calls[0][0] as string;
      expect(calledUrl).toMatch(/^https:\/\/api\.limelink\.org\/api\/v1\//);
    });
  });

  describe("createLink", () => {
    it("POST /core/link으로 요청한다", async () => {
      const responseBody = { id: "link-1", dynamic_link_suffix: "test" };
      fetchMock.mockResolvedValue(createMockResponse(responseBody));

      const result = await client.createLink({
        dynamic_link_suffix: "test",
        dynamic_link_url: "https://example.com",
        dynamic_link_name: "Test Link",
        project_id: "proj-1",
      });

      expect(fetchMock).toHaveBeenCalledWith(
        "https://api.limelink.org/api/v1/core/link",
        expect.objectContaining({
          method: "POST",
          body: expect.any(String),
        })
      );
      expect(result).toEqual(responseBody);
    });

    it("요청 바디를 JSON으로 직렬화한다", async () => {
      fetchMock.mockResolvedValue(createMockResponse({}));

      const body = { dynamic_link_suffix: "my-link", project_id: "p1" };
      await client.createLink(body);

      const callArgs = fetchMock.mock.calls[0];
      const requestInit = callArgs[1] as RequestInit;
      expect(JSON.parse(requestInit.body as string)).toEqual(body);
    });
  });

  describe("getLinkBySuffix", () => {
    it("GET /dynamic-link/{projectId}?... 으로 요청한다", async () => {
      const responseBody = { dynamic_links: [] };
      fetchMock.mockResolvedValue(createMockResponse(responseBody));

      const result = await client.getLinkBySuffix("proj-1", "my-suffix");

      const calledUrl = fetchMock.mock.calls[0][0] as string;
      expect(calledUrl).toBe(
        "https://api.limelink.org/api/v1/dynamic-link/proj-1?dynamic_link_suffix=my-suffix&call_type=API"
      );

      const requestInit = fetchMock.mock.calls[0][1] as RequestInit;
      expect(requestInit.method).toBe("GET");
      expect(requestInit.body).toBeUndefined();

      expect(result).toEqual(responseBody);
    });

    it("suffix에 특수문자가 있으면 URL 인코딩한다", async () => {
      fetchMock.mockResolvedValue(createMockResponse({}));

      await client.getLinkBySuffix("proj-1", "my link&test");

      const calledUrl = fetchMock.mock.calls[0][0] as string;
      expect(calledUrl).toContain("dynamic_link_suffix=my+link%26test");
    });
  });

  describe("에러 처리", () => {
    it("에러 응답에서 message 필드를 추출한다", async () => {
      fetchMock.mockResolvedValue(
        createErrorResponse(400, { message: "Suffix already exists" })
      );

      await expect(client.createLink({})).rejects.toEqual(
        expect.objectContaining({
          message: "Suffix already exists",
          statusCode: 400,
        })
      );
    });

    it("에러 응답에 message가 없으면 JSON을 문자열화한다", async () => {
      fetchMock.mockResolvedValue(
        createErrorResponse(422, { error: "VALIDATION_FAILED", details: [] })
      );

      await expect(client.createLink({})).rejects.toEqual(
        expect.objectContaining({
          message: expect.stringContaining("VALIDATION_FAILED"),
          statusCode: 422,
        })
      );
    });

    it("에러 응답이 JSON이 아니면 HTTP 상태를 사용한다", async () => {
      fetchMock.mockResolvedValue(
        createErrorResponse(500, undefined, "Internal Server Error")
      );

      await expect(client.createLink({})).rejects.toEqual(
        expect.objectContaining({
          message: "HTTP 500: Internal Server Error",
          statusCode: 500,
        })
      );
    });

    it("401 Unauthorized 에러를 올바르게 전파한다", async () => {
      fetchMock.mockResolvedValue(
        createErrorResponse(401, { message: "Invalid API key" }, "Unauthorized")
      );

      await expect(client.getLinkBySuffix("p", "s")).rejects.toEqual(
        expect.objectContaining({
          message: "Invalid API key",
          statusCode: 401,
        })
      );
    });
  });
});
