import { describe, it, expect } from "vitest";
import { registerCreateLink } from "../../../src/tools/create-link.js";
import {
  createMockMcpServer,
  createMockApiClient,
  createMockConfig,
  createMockConfigWithoutProjectId,
  createMockConfigWithoutApiKey,
  extractToolHandler,
} from "../../mocks/server.js";

describe("registerCreateLink (tool handler)", () => {
  const minimalParams = {
    dynamic_link_suffix: "test-link",
    dynamic_link_url: "https://example.com",
    dynamic_link_name: "Test Link",
  };

  function setup(configOverrides = {}) {
    const server = createMockMcpServer();
    const apiClient = createMockApiClient();
    const config = createMockConfig(configOverrides);
    registerCreateLink(server as any, apiClient as any, config);
    return { server, apiClient, config, handler: extractToolHandler(server) };
  }

  it("tool을 올바른 이름과 설명으로 등록한다", () => {
    const { server } = setup();
    expect(server.tool).toHaveBeenCalledWith(
      "create-link",
      expect.any(String),
      expect.any(Object),
      expect.any(Function)
    );
  });

  describe("API 키 누락", () => {
    it("apiClient가 null이면 API 키 필요 에러를 반환한다", async () => {
      const server = createMockMcpServer();
      const config = createMockConfigWithoutApiKey();
      registerCreateLink(server as any, null, config);
      const handler = extractToolHandler(server);

      const result = (await handler(minimalParams)) as any;

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("LIMELINK_API_KEY");
    });

    it("apiClient가 null이면 API 호출을 시도하지 않는다", async () => {
      const server = createMockMcpServer();
      const apiClient = createMockApiClient();
      const config = createMockConfigWithoutApiKey();
      registerCreateLink(server as any, null, config);
      const handler = extractToolHandler(server);

      await handler(minimalParams);

      expect(apiClient.createLink).not.toHaveBeenCalled();
    });
  });

  describe("project_id 해석", () => {
    it("파라미터의 project_id를 우선 사용한다", async () => {
      const { handler, apiClient } = setup();
      apiClient.createLink.mockResolvedValue({ id: "1" });

      await handler({
        ...minimalParams,
        project_id: "param-proj",
      });

      const body = apiClient.createLink.mock.calls[0][0];
      expect(body.project_id).toBe("param-proj");
    });

    it("파라미터에 없으면 config.projectId를 사용한다", async () => {
      const { handler, apiClient } = setup({ projectId: "config-proj" });
      apiClient.createLink.mockResolvedValue({ id: "1" });

      await handler(minimalParams);

      const body = apiClient.createLink.mock.calls[0][0];
      expect(body.project_id).toBe("config-proj");
    });

    it("둘 다 없으면 에러를 반환한다", async () => {
      const server = createMockMcpServer();
      const apiClient = createMockApiClient();
      const config = createMockConfigWithoutProjectId();
      registerCreateLink(server as any, apiClient as any, config);
      const handler = extractToolHandler(server);

      const result = (await handler(minimalParams)) as any;

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("project_id is required");
      expect(apiClient.createLink).not.toHaveBeenCalled();
    });
  });

  describe("요청 바디 구성", () => {
    it("필수 필드를 항상 포함한다", async () => {
      const { handler, apiClient } = setup();
      apiClient.createLink.mockResolvedValue({});

      await handler(minimalParams);

      const body = apiClient.createLink.mock.calls[0][0];
      expect(body).toEqual(
        expect.objectContaining({
          dynamic_link_suffix: "test-link",
          dynamic_link_url: "https://example.com",
          dynamic_link_name: "Test Link",
          project_id: "test-project-id",
        })
      );
    });

    it("stats_flag가 제공되면 포함한다", async () => {
      const { handler, apiClient } = setup();
      apiClient.createLink.mockResolvedValue({});

      await handler({ ...minimalParams, stats_flag: true });

      const body = apiClient.createLink.mock.calls[0][0];
      expect(body.stats_flag).toBe(true);
    });

    it("stats_flag가 false여도 포함한다 (undefined 아님)", async () => {
      const { handler, apiClient } = setup();
      apiClient.createLink.mockResolvedValue({});

      await handler({ ...minimalParams, stats_flag: false });

      const body = apiClient.createLink.mock.calls[0][0];
      expect(body.stats_flag).toBe(false);
    });

    it("stats_flag가 undefined이면 바디에 포함하지 않는다", async () => {
      const { handler, apiClient } = setup();
      apiClient.createLink.mockResolvedValue({});

      await handler(minimalParams);

      const body = apiClient.createLink.mock.calls[0][0];
      expect(body).not.toHaveProperty("stats_flag");
    });

    it("apple_options가 제공되면 포함한다", async () => {
      const { handler, apiClient } = setup();
      apiClient.createLink.mockResolvedValue({});

      const appleOptions = {
        application_id: "app-1",
        request_uri: "product/123",
      };
      await handler({ ...minimalParams, apple_options: appleOptions });

      const body = apiClient.createLink.mock.calls[0][0];
      expect(body.apple_options).toEqual(appleOptions);
    });

    it("android_options, additional_options가 제공되면 포함한다", async () => {
      const { handler, apiClient } = setup();
      apiClient.createLink.mockResolvedValue({});

      const params = {
        ...minimalParams,
        android_options: { application_id: "android-app" },
        additional_options: {
          preview_title: "Title",
          preview_description: "Desc",
          preview_image_url: "https://img.com/a.png",
        },
      };
      await handler(params);

      const body = apiClient.createLink.mock.calls[0][0];
      expect(body.android_options).toEqual({ application_id: "android-app" });
      expect(body.additional_options.preview_title).toBe("Title");
    });
  });

  describe("응답 포맷", () => {
    it("성공 시 JSON 문자열로 반환한다", async () => {
      const { handler, apiClient } = setup();
      const apiResult = { id: "link-1", dynamic_link_suffix: "test-link" };
      apiClient.createLink.mockResolvedValue(apiResult);

      const result = (await handler(minimalParams)) as any;

      expect(result.isError).toBeUndefined();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe("text");
      expect(JSON.parse(result.content[0].text)).toEqual(apiResult);
    });

    it("API 에러 시 isError와 메시지를 반환한다", async () => {
      const { handler, apiClient } = setup();
      apiClient.createLink.mockRejectedValue({
        message: "Duplicate suffix",
      });

      const result = (await handler(minimalParams)) as any;

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("Duplicate suffix");
    });

    it("message가 없는 에러는 String()으로 변환한다", async () => {
      const { handler, apiClient } = setup();
      apiClient.createLink.mockRejectedValue("raw error string");

      const result = (await handler(minimalParams)) as any;

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("raw error string");
    });
  });
});
