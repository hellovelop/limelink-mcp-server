import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ProfileRegistry } from "../lib/profile-registry.js";
export function registerListProfiles(server: McpServer, registry: ProfileRegistry): void {
  server.tool("list-profiles", "List locally configured LimeLink profile aliases", {}, async () => ({ content: [{ type: "text" as const, text: JSON.stringify(registry.list(), null, 2) }] }));
}
