import { describe, it, expect } from "vitest";
import { registerGetLinkBySuffix } from "../../../src/tools/get-link-by-suffix.js";
import { createMockMcpServer, createMockRegistry, extractToolHandler } from "../../mocks/server.js";

const project = "11111111-1111-4111-8111-111111111111";
describe("get-link-by-suffix profiles", () => {
  it("initializes profile and uses direct Project UUID", async () => {
    const s = createMockMcpServer();
    const { registry, apiClient } = createMockRegistry();
    apiClient.getLinkBySuffix.mockResolvedValue({});
    registerGetLinkBySuffix(s as any, registry);
    await extractToolHandler(s)({ suffix: "x", project });
    expect(apiClient.getLinkBySuffix).toHaveBeenCalledWith(project, "x");
  });
  it("requires a Project selector", () => {
    const s = createMockMcpServer();
    const { registry } = createMockRegistry();
    registerGetLinkBySuffix(s as any, registry);
    expect(() => s.tool.mock.calls[0][2].project.parse(undefined)).toThrow();
  });
});
