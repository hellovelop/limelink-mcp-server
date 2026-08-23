import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ProfileRegistry } from "../lib/profile-registry.js";
import { profileInput, toolError } from "./common.js";

const inputSchema = {
  profile: profileInput,
  url: z
    .string()
    .url()
    .max(2048)
    .refine((value) => new URL(value).protocol === "https:", {
      message: "URL must use HTTPS.",
    })
    .describe("Absolute LimeLink HTTPS URL to resolve"),
};

export function registerGetLinkByUrl(
  server: McpServer,
  registry: ProfileRegistry
): void {
  server.tool(
    "get-link-by-url",
    "Resolve a Free, Project-hostname, or Custom Domain LimeLink URL through the V2 API.",
    inputSchema,
    async ({ profile, url }) => {
      try {
        const selected = await registry.initialize(profile, "links:read");
        const result = await selected.client.resolveLinkByUrl(url);
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      } catch (error) {
        return toolError("Error resolving link: ", error);
      }
    }
  );
}
