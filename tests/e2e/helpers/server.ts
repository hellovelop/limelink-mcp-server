import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { resolve } from "node:path";

const SERVER_ENTRY = resolve(
  import.meta.dirname,
  "../../../dist/index.js"
);

export interface TestServer {
  client: Client;
  transport: StdioClientTransport;
  cleanup: () => Promise<void>;
}

export async function startServer(
  env: Record<string, string> = {}
): Promise<TestServer> {
  const transport = new StdioClientTransport({
    command: "node",
    args: [SERVER_ENTRY],
    env: {
      ...process.env,
      LIMELINK_API_KEY: "test-e2e-key",
      ...env,
    },
  });

  const client = new Client({
    name: "limelink-e2e-test",
    version: "1.0.0",
  });

  await client.connect(transport);

  const cleanup = async () => {
    try {
      await client.close();
    } catch {
      // 이미 닫혔을 수 있음
    }
    try {
      await transport.close();
    } catch {
      // 이미 닫혔을 수 있음
    }
  };

  return { client, transport, cleanup };
}
