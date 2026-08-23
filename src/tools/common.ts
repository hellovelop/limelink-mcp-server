import { z } from "zod";
export const profileInput = z.string().min(1).max(64).regex(/^[A-Za-z0-9][A-Za-z0-9._-]*$/).optional().describe("Configured LimeLink profile alias");
export const projectInput = z.string().min(1).max(100).describe("Configured Project alias or Project UUID");
export function toolError(prefix: string, error: unknown) {
  const value = error && typeof error === "object"
    ? error as { message?: unknown; statusCode?: unknown }
    : {};
  const message = value.message !== undefined ? String(value.message) : String(error);
  const status = typeof value.statusCode === "number" ? ` (HTTP ${value.statusCode})` : "";
  return { content: [{ type: "text" as const, text: `${prefix.trimEnd()}${status}: ${message}` }], isError: true };
}
