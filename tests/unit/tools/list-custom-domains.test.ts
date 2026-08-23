import { describe, it, expect } from "vitest";
import { registerListCustomDomains } from "../../../src/tools/list-custom-domains.js";
import { createMockMcpServer, createMockRegistry, extractToolHandler } from "../../mocks/server.js";

const projectId = "11111111-1111-4111-8111-111111111111";
describe("list-custom-domains", () => {
  it("uses introspected Organization and resolved Project alias", async () => {
    const s = createMockMcpServer();
    const profiles: any = { test: { apiKey: "test-key", organizationLabel: "Test", projects: new Map([["web", projectId]]) } };
    const { registry, apiClient } = createMockRegistry(undefined, profiles);
    apiClient.listCustomDomains.mockResolvedValue({ custom_domains: [] });
    registerListCustomDomains(s as any, registry);
    const result = await extractToolHandler(s)({ project: "web" });
    expect(apiClient.listCustomDomains).toHaveBeenCalledWith("22222222-2222-4222-8222-222222222222", projectId);
    expect(result.isError).toBeUndefined();
  });

  it("checks domains:read before domain discovery", async () => {
    const s = createMockMcpServer();
    const { registry, apiClient } = createMockRegistry();
    apiClient.getCurrentCredential.mockResolvedValue({ id: "c", organization_id: "o", key_prefix: "prefix", scopes: [] });
    registerListCustomDomains(s as any, registry);
    const result = await extractToolHandler(s)({ project: projectId });
    expect(result.isError).toBe(true);
    expect(apiClient.listCustomDomains).not.toHaveBeenCalled();
  });
});
