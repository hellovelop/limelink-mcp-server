import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { DocFetcher } from "../lib/doc-fetcher.js";
import { registerDocResources } from "./documentation.js";

export function registerResources(
  server: McpServer,
  docFetcher: DocFetcher
): void {
  registerDocResources(server, docFetcher);
}
