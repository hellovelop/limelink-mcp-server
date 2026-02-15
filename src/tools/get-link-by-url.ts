import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ApiClient } from "../lib/api-client.js";
import type { Config } from "../lib/config.js";

const API_KEY_REQUIRED_ERROR = {
  content: [
    {
      type: "text" as const,
      text: "Error: LIMELINK_API_KEY is not configured. Set the LIMELINK_API_KEY environment variable to use this tool.",
    },
  ],
  isError: true,
};

const inputSchema = {
  url: z.string().url().describe("Full Limelink dynamic link URL to look up"),
  project_id: z
    .string()
    .optional()
    .describe(
      "Project ID. Uses LIMELINK_PROJECT_ID env if not provided."
    ),
};

export function extractSuffix(url: string): string | null {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname;

    // Free plan: https://deep.limelink.org/{suffix}
    if (hostname === "deep.limelink.org") {
      const suffix = parsed.pathname.replace(/^\//, "");
      return suffix || null;
    }

    // Pro plan: https://{project}.limelink.org/link/{suffix}
    if (hostname.endsWith(".limelink.org")) {
      const match = parsed.pathname.match(/^\/link\/(.+)$/);
      return match ? match[1] : null;
    }

    return null;
  } catch {
    return null;
  }
}

export function registerGetLinkByUrl(
  server: McpServer,
  apiClient: ApiClient | null,
  config: Config
): void {
  server.tool(
    "get-link-by-url",
    "Look up a Limelink dynamic link by its full URL. Supports both Free (deep.limelink.org) and Pro ({project}.limelink.org/link/) URL formats.",
    inputSchema,
    async (params) => {
      if (!apiClient) return API_KEY_REQUIRED_ERROR;

      const suffix = extractSuffix(params.url);
      if (!suffix) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Error: Could not extract suffix from URL "${params.url}". Expected formats:\n- https://deep.limelink.org/{suffix}\n- https://{project}.limelink.org/link/{suffix}`,
            },
          ],
          isError: true,
        };
      }

      const projectId = params.project_id || config.projectId;
      if (!projectId) {
        return {
          content: [
            {
              type: "text" as const,
              text: "Error: project_id is required. Provide it as a parameter or set LIMELINK_PROJECT_ID environment variable.",
            },
          ],
          isError: true,
        };
      }

      try {
        const result = await apiClient.getLinkBySuffix(projectId, suffix);
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        const message =
          error && typeof error === "object" && "message" in error
            ? (error as { message: string }).message
            : String(error);
        return {
          content: [
            { type: "text" as const, text: `Error fetching link: ${message}` },
          ],
          isError: true,
        };
      }
    }
  );
}
