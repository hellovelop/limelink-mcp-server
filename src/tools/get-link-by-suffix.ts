import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ProfileRegistry } from "../lib/profile-registry.js";
import { profileInput, projectInput } from "./common.js";

const inputSchema = {
  profile: profileInput,
  suffix: z.string().describe("Dynamic link suffix to look up"),
  project: projectInput,
};

export function registerGetLinkBySuffix(server: McpServer, registry: ProfileRegistry): void {
  server.tool(
    "get-link-by-suffix",
    "Look up a Limelink dynamic link by its suffix",
    inputSchema,
    async (params) => {
      try {
        const selected = await registry.initialize(params.profile, "links:read");
        const apiClient = selected.client;
        const projectId = registry.resolveProject(selected.alias, params.project);
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
