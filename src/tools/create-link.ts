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
  dynamic_link_suffix: z
    .string()
    .max(50)
    .describe("Unique identifier for the short URL path"),
  dynamic_link_url: z
    .string()
    .url()
    .max(500)
    .describe("Target URL for desktop or fallback"),
  dynamic_link_name: z
    .string()
    .max(100)
    .describe("Link name for management and identification"),
  project_id: z
    .string()
    .optional()
    .describe(
      "Project ID the link belongs to. Uses LIMELINK_PROJECT_ID env if not provided."
    ),
  stats_flag: z.boolean().optional().describe("Enable analytics tracking"),
  apple_options: z
    .object({
      application_id: z
        .string()
        .max(100)
        .describe("iOS application ID registered in the dashboard"),
      request_uri: z.string().optional().describe("Deep link path inside the app"),
      not_installed_options: z
        .object({
          custom_url: z
            .string()
            .max(500)
            .describe("Redirect URL when the app is not installed"),
        })
        .optional(),
    })
    .optional()
    .describe("iOS-specific deep linking options"),
  android_options: z
    .object({
      application_id: z
        .string()
        .max(100)
        .describe("Android application ID registered in the dashboard"),
      request_uri: z.string().optional().describe("Deep link path inside the app"),
      not_installed_options: z
        .object({
          custom_url: z
            .string()
            .max(500)
            .describe("Redirect URL when the app is not installed"),
        })
        .optional(),
    })
    .optional()
    .describe("Android-specific deep linking options"),
  additional_options: z
    .object({
      preview_title: z.string().max(100).describe("Social preview title"),
      preview_description: z
        .string()
        .max(200)
        .describe("Social preview description"),
      preview_image_url: z
        .string()
        .max(500)
        .describe("Social preview image URL"),
      utm_source: z.string().optional().describe("UTM source parameter"),
      utm_medium: z.string().optional().describe("UTM medium parameter"),
      utm_campaign: z.string().optional().describe("UTM campaign parameter"),
    })
    .optional()
    .describe("Social preview and UTM tracking options"),
};

export function registerCreateLink(
  server: McpServer,
  apiClient: ApiClient | null,
  config: Config
): void {
  server.tool(
    "create-link",
    "Create a Limelink dynamic link with platform-specific deep linking, social previews, and UTM tracking",
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
        const body: Record<string, unknown> = {
          dynamic_link_suffix: params.dynamic_link_suffix,
          dynamic_link_url: params.dynamic_link_url,
          dynamic_link_name: params.dynamic_link_name,
          project_id: projectId,
        };

        if (params.stats_flag !== undefined) body.stats_flag = params.stats_flag;
        if (params.apple_options) body.apple_options = params.apple_options;
        if (params.android_options) body.android_options = params.android_options;
        if (params.additional_options)
          body.additional_options = params.additional_options;

        const result = await apiClient.createLink(body);
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
          content: [{ type: "text" as const, text: `Error creating link: ${message}` }],
          isError: true,
        };
      }
    }
  );
}
