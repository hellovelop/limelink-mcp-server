import { ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { DocFetcher } from "../lib/doc-fetcher.js";
import { isValidSlug, getValidSlugs, type DocSlug } from "../lib/doc-fetcher.js";

export function registerDocResources(
  server: McpServer,
  docFetcher: DocFetcher
): void {
  // Static resource: documentation index (llms.txt)
  server.resource(
    "docs-index",
    "limelink://docs/index",
    {
      description:
        "Limelink documentation index (llms.txt) — lists all available documentation pages",
      mimeType: "text/plain",
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "text/plain",
          text: await docFetcher.fetchIndex(),
        },
      ],
    })
  );

  // Dynamic resource template: individual documentation pages
  const slugs = getValidSlugs();
  server.resource(
    "docs-page",
    new ResourceTemplate("limelink://docs/{slug}", {
      list: async () => ({
        resources: slugs.map((slug) => ({
          uri: `limelink://docs/${slug}`,
          name: `Limelink Docs: ${slug}`,
          description: `Documentation page for ${slug}`,
          mimeType: "text/markdown",
        })),
      }),
    }),
    {
      description: "Individual Limelink documentation page by slug",
      mimeType: "text/markdown",
    },
    async (uri, variables) => {
      const slug = variables.slug as string;
      if (!isValidSlug(slug)) {
        throw new Error(
          `Invalid documentation slug: "${slug}". Valid slugs: ${slugs.join(", ")}`
        );
      }

      const text = await docFetcher.fetchDoc(slug as DocSlug);
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "text/markdown",
            text,
          },
        ],
      };
    }
  );
}
