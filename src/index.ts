#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadConfig } from "./lib/config.js";
import { ProfileRegistry } from "./lib/profile-registry.js";
import { DocFetcher } from "./lib/doc-fetcher.js";
import { registerTools } from "./tools/index.js";
import { registerResources } from "./resources/index.js";

const packageJsonUrl = new URL("../package.json", import.meta.url);
const { version } = JSON.parse(readFileSync(packageJsonUrl, "utf-8"));

function createMcpServer(): McpServer {
  return new McpServer({ name: "limelink", version });
}

export function createSandboxServer(): McpServer {
  const server = createMcpServer();

  registerTools(server, new ProfileRegistry({ version: 1, profiles: new Map() }));
  registerResources(server, new DocFetcher());

  return server;
}

async function main(): Promise<void> {
  const config = loadConfig();
  const registry = new ProfileRegistry(config);
  const docFetcher = new DocFetcher();

  const server = createMcpServer();

  registerTools(server, registry);
  registerResources(server, docFetcher);

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
