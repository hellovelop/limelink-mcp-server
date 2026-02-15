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
  suffix: z.string().describe("Dynamic link suffix to look up"),
  project_id: z
    .string()
    .optional()
    .describe(
      "Project ID. Uses LIMELINK_PROJECT_ID env if not provided."
    ),
};

export function registerGetLinkBySuffix(
  server: McpServer,
  apiClient: ApiClient | null,
  config: Config
): void {
  server.tool(
    "get-link-by-suffix",
    "Look up a Limelink dynamic link by its suffix",
    inputSchema,
    async (params) => {
      if (!apiClient) return API_KEY_REQUIRED_ERROR;

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
        const result = await apiClient.getLinkBySuffix(projectId, params.suffix);
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
