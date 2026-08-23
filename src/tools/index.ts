import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ProfileRegistry } from "../lib/profile-registry.js";
import { registerCreateLink } from "./create-link.js";
import { registerGetLinkBySuffix } from "./get-link-by-suffix.js";
import { registerGetLinkByUrl } from "./get-link-by-url.js";
import { registerListCustomDomains } from "./list-custom-domains.js";
import { registerListProfiles } from "./list-profiles.js";
import { registerListProjects } from "./list-projects.js";
export function registerTools(server: McpServer, registry: ProfileRegistry): void {
  registerCreateLink(server, registry);
  registerListCustomDomains(server, registry);
  registerGetLinkBySuffix(server, registry);
  registerGetLinkByUrl(server, registry);
  registerListProfiles(server, registry);
  registerListProjects(server, registry);
}
