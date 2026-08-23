import { describe, it, expect } from "vitest";
import { registerCreateLink } from "../../../src/tools/create-link.js";
import { createMockMcpServer, createMockRegistry, extractToolHandler } from "../../mocks/server.js";

const project = "11111111-1111-4111-8111-111111111111";
const params = { dynamic_link_url: "https://example.com", dynamic_link_name: "X", project };

describe("create-link V2 profiles", () => {
  it("initializes selected profile and resolves direct Project UUID", async () => {
    const s = createMockMcpServer();
    const { registry, apiClient } = createMockRegistry();
    apiClient.createLink.mockResolvedValue({ id: "1" });
    registerCreateLink(s as any, registry);
    const result = await extractToolHandler(s)(params);
    expect(apiClient.getCurrentCredential).toHaveBeenCalledOnce();
    expect(apiClient.createLink).toHaveBeenCalledWith(expect.objectContaining({ project_id: project }));
    expect(result.isError).toBeUndefined();
  });

  it("resolves configured Project alias", async () => {
    const s = createMockMcpServer();
    const profiles: any = { test: { apiKey: "test-key", organizationLabel: "Test", projects: new Map([["marketing", project]]) } };
    const { registry, apiClient } = createMockRegistry(undefined, profiles);
    apiClient.createLink.mockResolvedValue({});
    registerCreateLink(s as any, registry);
    await extractToolHandler(s)({ ...params, project: "marketing" });
    expect(apiClient.createLink).toHaveBeenCalledWith(expect.objectContaining({ project_id: project }));
  });

  it("requires project and allows omitted suffix", () => {
    const s = createMockMcpServer();
    const { registry } = createMockRegistry();
    registerCreateLink(s as any, registry);
    const schema = s.tool.mock.calls[0][2];
    expect(() => schema.project.parse(undefined)).toThrow();
    expect(schema.dynamic_link_suffix.parse(undefined)).toBeUndefined();
    expect(schema.dynamic_link_suffix.parse("x".repeat(100))).toHaveLength(100);
  });

  it("passes official V2 custom and platform options through", async () => {
    const s = createMockMcpServer();
    const { registry, apiClient } = createMockRegistry();
    apiClient.createLink.mockResolvedValue({});
    registerCreateLink(s as any, registry);
    const options = {
      custom_domain_id: "44444444-4444-4444-8444-444444444444",
      apple_options: {
        application_id: null,
        application_info: { app_id: "com.example.app" },
        not_installed_options: { custom_url: "https://example.com/install" },
        apple_advanced_options: { ipad_option: true },
      },
      android_options: { android_advanced_options: { version: "1" } },
      additional_options: { skip_app_preview: true },
    };
    await extractToolHandler(s)({ ...params, ...options });
    expect(apiClient.createLink).toHaveBeenCalledWith(expect.objectContaining(options));
  });

  it("rejects unknown official option fields", () => {
    const s = createMockMcpServer();
    const { registry } = createMockRegistry();
    registerCreateLink(s as any, registry);
    const apple = s.tool.mock.calls[0][2].apple_options.unwrap().unwrap();
    expect(() => apple.parse({ unknown: true })).toThrow();
  });

  it("preserves upstream JSON details and fallback HTTP status", async () => {
    const s = createMockMcpServer();
    const { registry, apiClient } = createMockRegistry();
    apiClient.createLink.mockRejectedValue({ statusCode: 422, message: JSON.stringify({ message: ["invalid"], error: "Validation" }) });
    registerCreateLink(s as any, registry);
    const result = await extractToolHandler(s)(params);
    expect(result.content[0].text).toContain("HTTP 422");
    expect(result.content[0].text).toContain("Validation");
  });

  it("accepts optional preview fields and rejects malformed image URLs", () => {
    const s = createMockMcpServer();
    const { registry } = createMockRegistry();
    registerCreateLink(s as any, registry);
    const additional = s.tool.mock.calls[0][2].additional_options.unwrap().unwrap();
    expect(additional.parse({ utm_source: "source" })).toEqual({ utm_source: "source" });
    expect(() => additional.parse({ preview_image_url: "not-a-url" })).toThrow();
  });
});
