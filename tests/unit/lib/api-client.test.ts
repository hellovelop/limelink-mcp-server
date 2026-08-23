import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ApiClient } from "../../../src/lib/api-client.js";
import {
  mockFetch,
  createMockResponse,
  createErrorResponse,
} from "../../mocks/fetch.js";

const linkFixture = {
  id: "66666666-6666-4666-8666-666666666666",
  organization_id: "22222222-2222-4222-8222-222222222222",
  project_id: "33333333-3333-4333-8333-333333333333",
  custom_domain_id: null,
  domain_type: "DEFAULT",
  hostname: "example.limelink.org",
  suffix: "campaign",
  short_url: "https://example.limelink.org/campaign",
  dynamic_link_url: "https://destination.example/path",
  dynamic_link_name: "Campaign",
  apple_options: null,
  android_options: null,
  applications: { apple: null, android: null },
  additional_options: null,
  stats_flag: false,
  created_at: "2026-08-23T00:00:00.000Z",
  updated_at: null,
};

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

    it("API origin을 사용한다", async () => {
      fetchMock.mockResolvedValue(createMockResponse({}));

      await client.createLink({});

      const calledUrl = fetchMock.mock.calls[0][0] as string;
      expect(calledUrl).toMatch(/^https:\/\/api\.limelink\.org\/api\/v2\//);
    });

    it("동시 요청에서도 각 client의 API key를 격리한다", async () => {
      fetchMock.mockResolvedValue(createMockResponse({ projects: [] }));
      const first = new ApiClient("first-profile-key");
      const second = new ApiClient("second-profile-key");

      await Promise.all([
        first.listProjects("11111111-1111-4111-8111-111111111111"),
        second.listProjects("22222222-2222-4222-8222-222222222222"),
      ]);

      const headers = fetchMock.mock.calls.map(
        ([, init]) => (init as RequestInit).headers as Record<string, string>
      );
      expect(headers.map((value) => value["X-API-KEY"])).toEqual([
        "first-profile-key",
        "second-profile-key",
      ]);
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
        "https://api.limelink.org/api/v2/core/link",
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

  describe("resolveLinkByUrl", () => {
    it("full URL을 V2 resolve query로 인코딩하고 Link를 검증한다", async () => {
      fetchMock.mockResolvedValue(createMockResponse(linkFixture));
      const url = "https://go.customer.example/campaign";

      await expect(client.resolveLinkByUrl(url)).resolves.toEqual(linkFixture);

      expect(fetchMock).toHaveBeenCalledWith(
        "https://api.limelink.org/api/v2/links/resolve?url=https%3A%2F%2Fgo.customer.example%2Fcampaign",
        expect.objectContaining({ method: "GET", body: undefined })
      );
    });

    it("불완전한 Link 응답을 거부한다", async () => {
      fetchMock.mockResolvedValue(createMockResponse({ id: linkFixture.id }));
      await expect(
        client.resolveLinkByUrl("https://go.customer.example/campaign")
      ).rejects.toEqual({ message: "LimeLink API returned an invalid Link." });
    });

    it.each([400, 401, 403, 404, 409])(
      "HTTP %i resolve 오류를 보존한다",
      async (status) => {
        const body = { statusCode: status, message: "resolve failed", error: "ERROR" };
        fetchMock.mockResolvedValue(createErrorResponse(status, body));
        await expect(
          client.resolveLinkByUrl("https://go.customer.example/campaign")
        ).rejects.toEqual({ message: JSON.stringify(body), statusCode: status });
      }
    );
  });

  describe("V2 profile discovery", () => {
    it("현재 credential context를 조회한다", async () => {
      const context = { id: "77777777-7777-4777-8777-777777777777", organization_id: "22222222-2222-4222-8222-222222222222", key_prefix: "AbCd12", scopes: ["projects:read"] };
      fetchMock.mockResolvedValue(createMockResponse(context));
      await expect(client.getCurrentCredential()).resolves.toEqual(context);
      expect(fetchMock).toHaveBeenCalledWith("https://api.limelink.org/api/v2/api-credentials/current", expect.objectContaining({ method: "GET" }));
    });

    it("개발 API의 generic UUID credential context를 허용한다", async () => {
      const context = {
        id: "77777777-7777-4777-8777-777777777777",
        organization_id: "22222222-2222-0000-0000-222222222222",
        key_prefix: "AbCd12",
        scopes: ["projects:read"],
      };
      fetchMock.mockResolvedValue(createMockResponse(context));
      await expect(client.getCurrentCredential()).resolves.toEqual(context);
    });

    it("introspection organization으로 프로젝트를 조회한다", async () => {
      fetchMock.mockResolvedValue(createMockResponse({ projects: [] }));
      await client.listProjects("org/id");
      expect(fetchMock).toHaveBeenCalledWith("https://api.limelink.org/api/v2/organizations/org%2Fid/projects", expect.objectContaining({ method: "GET" }));
    });

    it("introspection Organization과 Project로 Custom Domain을 조회한다", async () => {
      fetchMock.mockResolvedValue(createMockResponse({ custom_domains: [] }));
      await client.listCustomDomains("org/id", "project/id");
      expect(fetchMock).toHaveBeenCalledWith(
        "https://api.limelink.org/api/v2/organizations/org%2Fid/projects/project%2Fid/custom-domains",
        expect.objectContaining({ method: "GET" })
      );
    });

    it("불완전한 CustomDomainList 응답을 거부한다", async () => {
      fetchMock.mockResolvedValue(createMockResponse({ custom_domains: [{ id: "invalid" }] }));
      await expect(client.listCustomDomains("org", "project")).rejects.toEqual({
        message: "LimeLink API returned an invalid Custom Domain list.",
      });
    });

    it("명시적으로 주입한 개발 API origin을 사용한다", async () => {
      fetchMock.mockResolvedValue(createMockResponse({ projects: [] }));
      const developmentClient = new ApiClient(
        "test-api-key",
        "https://api.dev.limelink.org"
      );

      await developmentClient.listProjects(
        "22222222-2222-4222-8222-222222222222"
      );

      expect(fetchMock).toHaveBeenCalledWith(
        "https://api.dev.limelink.org/api/v2/organizations/22222222-2222-4222-8222-222222222222/projects",
        expect.objectContaining({ method: "GET" })
      );
    });

    it("공식 ProjectList 스키마를 검증한다", async () => {
      const project = {
        id: "11111111-1111-4111-8111-111111111111",
        organization_id: "22222222-2222-4222-8222-222222222222",
        created_by_user_id: "33333333-3333-4333-8333-333333333333",
        project_name: "Example",
        logo_image_id: null,
        sub_domain: null,
        logo_image: null,
        skin_info: { theme: "lime" },
        android_app_flag: false,
        ios_app_flag: true,
        created_at: "2026-08-23T00:00:00.000Z",
        updated_at: "2026-08-23T01:00:00.000Z",
      };
      fetchMock.mockResolvedValue(createMockResponse({ projects: [project] }));

      await expect(
        client.listProjects("22222222-2222-4222-8222-222222222222")
      ).resolves.toEqual({ projects: [project] });
    });

    it("불완전한 ProjectList 응답을 거부한다", async () => {
      fetchMock.mockResolvedValue(
        createMockResponse({ projects: [{ id: "not-a-project" }] })
      );

      await expect(
        client.listProjects("22222222-2222-4222-8222-222222222222")
      ).rejects.toEqual({
        message: "LimeLink API returned an invalid project list.",
      });
    });
  });

  describe("에러 처리", () => {
    it("공식 JSON 오류 본문과 상태 코드를 보존한다", async () => {
      const body = { statusCode: 400, message: ["invalid project_id"], error: "Bad Request" };
      fetchMock.mockResolvedValue(createErrorResponse(400, body));
      await expect(client.createLink({})).rejects.toEqual({
        message: JSON.stringify(body),
        statusCode: 400,
      });
    });

    it.each([401, 403, 404])("HTTP %i의 upstream body를 전파한다", async (status) => {
      fetchMock.mockResolvedValue(createErrorResponse(status, { message: "upstream detail" }));
      await expect(client.getLinkBySuffix("p", "s")).rejects.toEqual({
        message: JSON.stringify({ message: "upstream detail" }),
        statusCode: status,
      });
    });

    it("잘못된 credential context를 거부한다", async () => {
      fetchMock.mockResolvedValue(createMockResponse({ organization_id: "not-a-uuid" }));
      await expect(client.getCurrentCredential()).rejects.toEqual({
        message: "LimeLink API returned an invalid credential context.",
      });
    });
  });
});
