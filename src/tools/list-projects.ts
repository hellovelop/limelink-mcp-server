import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ProfileRegistry } from "../lib/profile-registry.js";
import { profileInput } from "./common.js";
export function registerListProjects(server: McpServer, registry: ProfileRegistry): void {
  server.tool("list-projects", "List Projects in the selected LimeLink Organization", { profile: profileInput }, async ({ profile }) => {
    try {
      const selected = await registry.initialize(profile, "projects:read");
      const result = await selected.client.listProjects(selected.credential.organization_id);
      const aliases = registry.projectAliases(selected.alias);
      const projects = result.projects.map((project) => ({
        ...project,
        aliases: [...aliases.entries()]
          .filter(([, id]) => id === project.id)
          .map(([alias]) => alias)
          .sort(),
      }));
      return { content: [{ type: "text" as const, text: JSON.stringify({ projects }, null, 2) }] };
    } catch (error) {
      const value = error && typeof error === "object" ? error as { message?: unknown; statusCode?: unknown } : {};
      const message = typeof value.message === "string" ? value.message : "Unexpected error.";
      const status = typeof value.statusCode === "number" ? ` (HTTP ${value.statusCode})` : "";
      return { content: [{ type: "text" as const, text: `Error listing projects${status}: ${message}` }], isError: true };
    }
  });
}
