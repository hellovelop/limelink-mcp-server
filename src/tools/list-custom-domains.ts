import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ProfileRegistry } from "../lib/profile-registry.js";
import { profileInput, projectInput, toolError } from "./common.js";

export function registerListCustomDomains(
  server: McpServer,
  registry: ProfileRegistry
): void {
  server.tool(
    "list-custom-domains",
    "List Custom Domains for a LimeLink Project",
    { profile: profileInput, project: projectInput },
    async ({ profile, project }) => {
      try {
        const selected = await registry.initialize(profile, "domains:read");
        const projectId = registry.resolveProject(selected.alias, project);
        const result = await selected.client.listCustomDomains(
          selected.credential.organization_id,
          projectId
        );
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      } catch (error) {
        return toolError("Error listing custom domains: ", error);
      }
    }
  );
}
