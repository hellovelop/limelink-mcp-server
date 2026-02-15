#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadConfig } from "./lib/config.js";
import { ApiClient } from "./lib/api-client.js";
import { DocFetcher } from "./lib/doc-fetcher.js";
import { registerTools } from "./tools/index.js";
import { registerResources } from "./resources/index.js";
import { registerPrompts } from "./prompts/index.js";

async function main(): Promise<void> {
  const config = loadConfig();
  const apiClient = config.apiKey ? new ApiClient(config.apiKey) : null;
  const docFetcher = new DocFetcher();

  const server = new McpServer({
    name: "limelink",
    version: "1.0.0",
  });

  registerTools(server, apiClient, config);
  registerResources(server, docFetcher);
  registerPrompts(server);

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
