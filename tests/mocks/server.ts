import { vi } from "vitest";
import { ProfileRegistry } from "../../src/lib/profile-registry.js";
export function createMockApiClient() { return { createLink: vi.fn(), getLinkBySuffix: vi.fn(), resolveLinkByUrl: vi.fn(), getCurrentCredential: vi.fn().mockResolvedValue({id:"77777777-7777-4777-8777-777777777777",organization_id:"22222222-2222-4222-8222-222222222222",key_prefix:"AbCd12",scopes:["projects:read","domains:read","links:read","links:write"]}), listProjects: vi.fn(), listCustomDomains: vi.fn() }; }
export function createMockRegistry(apiClient = createMockApiClient(), profiles: Record<string,{apiKey:string;organizationLabel:string}> = { test: {apiKey:"test-key", organizationLabel:"Test"}}, defaultProfile="test") {
  const map = new Map(Object.entries(profiles));
  const registry = new ProfileRegistry({version:1, defaultProfile, profiles:map}, ()=>apiClient as any);
  return { registry, apiClient };
}
export function createMockMcpServer() { return { tool: vi.fn(), resource: vi.fn() }; }
export function extractToolHandler(server: ReturnType<typeof createMockMcpServer>, index=0) { const call=server.tool.mock.calls[index]; return call[call.length-1] as (params: any)=>Promise<any>; }
