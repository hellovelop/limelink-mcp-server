import { DOCS_BASE_URL } from "./config.js";
import { TTLCache } from "./cache.js";

const VALID_SLUGS = [
  "introduction",
  "getting-started",
  "project",
  "application",
  "dynamic-link",
  "create-link",
  "link-detail",
  "link-management",
  "appearance",
  "sdk-integration",
  "ios-sdk",
  "android-sdk",
  "api-integration",
  "advanced",
  "llm-agent",
] as const;

export type DocSlug = (typeof VALID_SLUGS)[number];

export function isValidSlug(slug: string): slug is DocSlug {
  return (VALID_SLUGS as readonly string[]).includes(slug);
}

export function getValidSlugs(): readonly string[] {
  return VALID_SLUGS;
}

export class DocFetcher {
  private cache = new TTLCache<string>();

  async fetchIndex(): Promise<string> {
    const cached = this.cache.get("llms.txt");
    if (cached) return cached;

    const url = `${DOCS_BASE_URL}/llms.txt`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to fetch llms.txt: HTTP ${res.status}`);
    }

    const text = await res.text();
    this.cache.set("llms.txt", text);
    return text;
  }

  async fetchDoc(slug: DocSlug): Promise<string> {
    const cacheKey = `doc:${slug}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    const url = `${DOCS_BASE_URL}/md/${slug}.md`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(
        `Failed to fetch document '${slug}': HTTP ${res.status}`
      );
    }

    const text = await res.text();
    this.cache.set(cacheKey, text);
    return text;
  }
}
