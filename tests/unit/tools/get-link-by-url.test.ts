import { describe, it, expect } from "vitest";
import { registerGetLinkByUrl } from "../../../src/tools/get-link-by-url.js";
import {
  createMockMcpServer,
  createMockRegistry,
  extractToolHandler,
} from "../../mocks/server.js";

const resolvedLink = {
  id: "66666666-6666-4666-8666-666666666666",
  short_url: "https://go.customer.example/campaign",
};

describe("get-link-by-url", () => {
  it("credential profile이 없으면 발급 경로를 안내한다", async () => {
    const server = createMockMcpServer();
    const { registry } = createMockRegistry(undefined, {}, undefined as never);
    registerGetLinkByUrl(server as never, registry);

    const result = await extractToolHandler(server)({
      url: "https://go.customer.example/campaign",
    });

    expect(JSON.stringify(result)).toContain("https://limelink.org/organizations");
  });

  it.each([
    "https://deep.limelink.org/campaign",
    "https://project.limelink.org/campaign",
    "https://go.customer.example/campaign",
  ])("full URL을 V2 resolver에 그대로 전달한다: %s", async (url) => {
    const server = createMockMcpServer();
    const { registry, apiClient } = createMockRegistry();
    apiClient.resolveLinkByUrl.mockResolvedValue(resolvedLink);
    registerGetLinkByUrl(server as never, registry);

    const result = await extractToolHandler(server)({ url });

    expect(apiClient.resolveLinkByUrl).toHaveBeenCalledWith(url);
    expect(apiClient.getLinkBySuffix).not.toHaveBeenCalled();
    expect(result.isError).toBeUndefined();
    expect(JSON.parse(result.content[0].text)).toEqual(resolvedLink);
  });

  it("links:read가 없으면 resolver를 호출하지 않는다", async () => {
    const server = createMockMcpServer();
    const { registry, apiClient } = createMockRegistry();
    apiClient.getCurrentCredential.mockResolvedValue({
      id: "77777777-7777-4777-8777-777777777777",
      organization_id: "22222222-2222-4222-8222-222222222222",
      key_prefix: "AbCd12",
      scopes: ["projects:read"],
    });
    registerGetLinkByUrl(server as never, registry);

    const result = await extractToolHandler(server)({
      url: "https://go.customer.example/campaign",
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("links:read");
    expect(apiClient.resolveLinkByUrl).not.toHaveBeenCalled();
  });

  it.each([400, 401, 403, 404, 409])(
    "upstream HTTP %i status와 JSON 오류를 보존한다",
    async (status) => {
      const server = createMockMcpServer();
      const { registry, apiClient } = createMockRegistry();
      const message = status === 400
        ? ["URL must be absolute HTTPS."]
        : status === 404
          ? "Link not found."
          : "Resolve failed.";
      apiClient.resolveLinkByUrl.mockRejectedValue({
        statusCode: status,
        message: JSON.stringify({ statusCode: status, message, error: "ERROR" }),
      });
      registerGetLinkByUrl(server as never, registry);

      const result = await extractToolHandler(server)({
        url: "https://go.customer.example/missing",
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain(`HTTP ${status}`);
      expect(result.content[0].text).toContain(
        Array.isArray(message) ? message[0] : message
      );
    }
  );
});
