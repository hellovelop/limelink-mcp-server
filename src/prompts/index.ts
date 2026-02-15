import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerCreateLinkPrompt } from "./create-link-prompt.js";
import { registerDeepLinkPrompt } from "./deep-link-prompt.js";

export function registerPrompts(server: McpServer): void {
  registerCreateLinkPrompt(server);
  registerDeepLinkPrompt(server);
}
