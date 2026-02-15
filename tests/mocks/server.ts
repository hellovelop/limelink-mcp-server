import { vi } from "vitest";
import type { Config } from "../../src/lib/config.js";

export function createMockConfig(overrides: Partial<Config> = {}): Config {
  return {
    apiKey: "test-api-key",
    projectId: "test-project-id",
    ...overrides,
  };
}

export function createMockConfigWithoutProjectId(): Config {
  return {
    apiKey: "test-api-key",
    projectId: undefined,
  };
}

export function createMockConfigWithoutApiKey(): Config {
  return {
    apiKey: undefined,
    projectId: "test-project-id",
  };
}

export function createMockApiClient() {
  return {
    createLink: vi.fn(),
    getLinkBySuffix: vi.fn(),
  };
}

export function createMockMcpServer() {
  return {
    tool: vi.fn(),
    resource: vi.fn(),
    prompt: vi.fn(),
  };
}

/**
 * McpServer.tool() 호출에서 핸들러 콜백을 추출합니다.
 * server.tool(name, description, schema, handler) — handler는 4번째 인자
 */
export function extractToolHandler(mockServer: ReturnType<typeof createMockMcpServer>, index = 0) {
  const call = mockServer.tool.mock.calls[index];
  // handler is the last argument
  return call[call.length - 1] as (params: Record<string, unknown>) => Promise<unknown>;
}

/**
 * McpServer.prompt() 호출에서 핸들러 콜백을 추출합니다.
 * server.prompt(name, description, schema, handler) — handler는 4번째 인자
 */
export function extractPromptHandler(mockServer: ReturnType<typeof createMockMcpServer>, index = 0) {
  const call = mockServer.prompt.mock.calls[index];
  return call[call.length - 1] as (params: Record<string, unknown>) => unknown;
}
