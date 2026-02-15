import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const argsSchema = {
  target_url: z.string().url().describe("The destination URL for the dynamic link"),
  suffix: z
    .string()
    .optional()
    .describe("Custom suffix for the short link (auto-generated if omitted)"),
  platforms: z
    .enum(["ios", "android", "both", "web"])
    .describe("Target platforms for deep linking"),
};

export function registerCreateLinkPrompt(server: McpServer): void {
  server.prompt(
    "create-dynamic-link",
    "Guide for creating a Limelink dynamic link with platform-specific deep linking",
    argsSchema,
    ({ target_url, suffix, platforms }) => {
      const suffixNote = suffix
        ? `Use "${suffix}" as the link suffix.`
        : "Generate an appropriate suffix based on the target URL content.";

      let platformInstructions: string;
      switch (platforms) {
        case "ios":
          platformInstructions =
            "Configure apple_options with the iOS application_id and appropriate request_uri. Set not_installed_options.custom_url to the App Store link.";
          break;
        case "android":
          platformInstructions =
            "Configure android_options with the Android application_id and appropriate request_uri. Set not_installed_options.custom_url to the Play Store link.";
          break;
        case "both":
          platformInstructions =
            "Configure both apple_options and android_options with their respective application_ids and request_uris. Set not_installed_options.custom_url for each platform's store link.";
          break;
        case "web":
          platformInstructions =
            "No platform-specific options needed. The link will redirect to the target URL on all platforms.";
          break;
      }

      return {
        messages: [
          {
            role: "user" as const,
            content: {
              type: "text" as const,
              text: `Create a Limelink dynamic link with the following requirements:

**Target URL**: ${target_url}
**Suffix**: ${suffixNote}
**Platforms**: ${platforms}

## Instructions

1. Use the \`create-link\` tool to create the dynamic link.
2. ${platformInstructions}
3. Set a descriptive dynamic_link_name based on the target URL content.
4. Enable stats_flag for analytics tracking.
5. Consider adding additional_options with preview_title, preview_description, and preview_image_url for social sharing.

## Important Notes

- The project_id will be resolved from the environment variable if not specified.
- Ensure the suffix is unique and URL-safe (max 50 characters).
- The target URL must be valid and accessible (max 500 characters).
- For platform options, you need the application_id from the Limelink dashboard.`,
            },
          },
        ],
      };
    }
  );
}
