import { describe, it, expect } from "vitest";
import { registerGetLinkBySuffix } from "../../../src/tools/get-link-by-suffix.js";
import {
  createMockMcpServer,
  createMockApiClient,
  createMockConfig,
  createMockConfigWithoutProjectId,
  createMockConfigWithoutApiKey,
  extractToolHandler,
} from "../../mocks/server.js";

describe("registerGetLinkBySuffix (tool handler)", () => {
  function setup(configOverrides = {}) {
    const server = createMockMcpServer();
    const apiClient = createMockApiClient();
    const config = createMockConfig(configOverrides);
    registerGetLinkBySuffix(server as any, apiClient as any, config);
    return { server, apiClient, config, handler: extractToolHandler(server) };
  }

  it("tool을 올바른 이름으로 등록한다", () => {
    const { server } = setup();
    expect(server.tool).toHaveBeenCalledWith(
      "get-link-by-suffix",
      expect.any(String),
      expect.any(Object),
      expect.any(Function)
    );
  });

  describe("API 키 누락", () => {
    it("apiClient가 null이면 API 키 필요 에러를 반환한다", async () => {
      const server = createMockMcpServer();
      const config = createMockConfigWithoutApiKey();
      registerGetLinkBySuffix(server as any, null, config);
      const handler = extractToolHandler(server);

      const result = (await handler({ suffix: "test" })) as any;

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("LIMELINK_API_KEY");
    });
  });

  it("suffix와 project_id로 API를 호출한다", async () => {
    const { handler, apiClient } = setup();
    apiClient.getLinkBySuffix.mockResolvedValue({ dynamic_links: [] });

    const result = (await handler({
      suffix: "my-link",
      project_id: "proj-1",
    })) as any;

    expect(apiClient.getLinkBySuffix).toHaveBeenCalledWith("proj-1", "my-link");
    expect(result.isError).toBeUndefined();
  });

  it("project_id 누락 시 config에서 가져온다", async () => {
    const { handler, apiClient } = setup({ projectId: "cfg-proj" });
    apiClient.getLinkBySuffix.mockResolvedValue({});

    await handler({ suffix: "test" });

    expect(apiClient.getLinkBySuffix).toHaveBeenCalledWith("cfg-proj", "test");
  });

  it("project_id가 모두 없으면 에러를 반환한다", async () => {
    const server = createMockMcpServer();
    const apiClient = createMockApiClient();
    const config = createMockConfigWithoutProjectId();
    registerGetLinkBySuffix(server as any, apiClient as any, config);
    const handler = extractToolHandler(server);

    const result = (await handler({ suffix: "test" })) as any;

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("project_id is required");
  });

  it("API 에러를 적절히 포맷한다 (message 프로퍼티)", async () => {
    const { handler, apiClient } = setup();
    apiClient.getLinkBySuffix.mockRejectedValue({
      message: "Link not found",
    });

    const result = (await handler({ suffix: "missing" })) as any;

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Link not found");
  });

  it("message 프로퍼티 없는 에러를 String()으로 포맷한다", async () => {
    const { handler, apiClient } = setup();
    apiClient.getLinkBySuffix.mockRejectedValue("raw string error");

    const result = (await handler({ suffix: "missing" })) as any;

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("raw string error");
  });

  it("성공 응답을 JSON으로 반환한다", async () => {
    const { handler, apiClient } = setup();
    const apiResult = {
      dynamic_links: [{ id: "1", dynamic_link_suffix: "promo" }],
    };
    apiClient.getLinkBySuffix.mockResolvedValue(apiResult);

    const result = (await handler({ suffix: "promo" })) as any;

    expect(JSON.parse(result.content[0].text)).toEqual(apiResult);
  });
});
