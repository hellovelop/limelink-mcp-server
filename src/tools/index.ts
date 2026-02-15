import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ApiClient } from "../lib/api-client.js";
import type { Config } from "../lib/config.js";
import { registerCreateLink } from "./create-link.js";
import { registerGetLinkBySuffix } from "./get-link-by-suffix.js";
import { registerGetLinkByUrl } from "./get-link-by-url.js";

export function registerTools(
  server: McpServer,
  apiClient: ApiClient | null,
  config: Config
): void {
  registerCreateLink(server, apiClient, config);
  registerGetLinkBySuffix(server, apiClient, config);
  registerGetLinkByUrl(server, apiClient, config);
}
