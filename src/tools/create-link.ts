import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ProfileRegistry } from "../lib/profile-registry.js";
import { profileInput, toolError } from "./common.js";

const nullableString = (max: number) => z.string().max(max).nullable().optional();
const nullableBoolean = z.boolean().nullable().optional();

const notInstalledOptions = z
  .object({
    not_installed_options_action: nullableString(100),
    custom_url: nullableString(500),
  })
  .strict();

const appleAdvancedOptions = z
  .object({
    ipad_option: nullableBoolean,
    app_store_campaign_option: nullableBoolean,
    basic_custom_url_option: nullableBoolean,
    ipad_store_id: nullableString(100),
    ipad_scheme: nullableString(50),
    at: nullableString(500),
    ct: nullableString(500),
    pt: nullableString(500),
    mt: nullableString(500),
    ius: nullableString(100),
  })
  .strict();

const androidAdvancedOptions = z
  .object({
    advanced_option: nullableBoolean,
    version: nullableString(50),
  })
  .strict();

const appleApplicationInfo = z
  .object({
    app_id: nullableString(100),
    app_store_id: nullableString(100),
    app_scheme: nullableString(50),
    app_name: nullableString(200),
  })
  .strict();

const androidApplicationInfo = z
  .object({
    app_package_name: nullableString(200),
    app_scheme: nullableString(50),
    app_name: nullableString(200),
    sha256_fingerprint: nullableString(500),
  })
  .strict();

const inputSchema = {
  profile: profileInput,
  project: z
    .string()
    .min(1)
    .max(100)
    .describe("Configured Project alias or Project UUID"),
  dynamic_link_url: z.string().url().max(500),
  dynamic_link_name: z.string().max(100),
  dynamic_link_suffix: z.string().min(1).max(100).optional(),
  custom_domain_id: z.string().uuid().nullable().optional(),
  stats_flag: z.boolean().optional(),
  apple_options: z
    .object({
      apple_action: nullableString(100),
      application_id: nullableString(100),
      request_uri: z.string().nullable().optional(),
      application_info: appleApplicationInfo.nullable().optional(),
      not_installed_options: notInstalledOptions.nullable().optional(),
      apple_advanced_options: appleAdvancedOptions.nullable().optional(),
    })
    .strict()
    .nullable()
    .optional(),
  android_options: z
    .object({
      android_action: nullableString(100),
      application_id: nullableString(100),
      request_uri: z.string().nullable().optional(),
      application_info: androidApplicationInfo.nullable().optional(),
      not_installed_options: notInstalledOptions.nullable().optional(),
      android_advanced_options: androidAdvancedOptions.nullable().optional(),
    })
    .strict()
    .nullable()
    .optional(),
  additional_options: z
    .object({
      preview_action: nullableBoolean,
      utm_action: nullableBoolean,
      preview_title: nullableString(100),
      preview_description: nullableString(200),
      preview_image_url: z.string().url().max(500).nullable().optional(),
      utm_source: nullableString(500),
      utm_medium: nullableString(200),
      utm_campaign: nullableString(500),
      skip_app_preview: nullableBoolean,
    })
    .strict()
    .nullable()
    .optional(),
};

export function registerCreateLink(server: McpServer, registry: ProfileRegistry): void {
  server.tool(
    "create-link",
    "Create a LimeLink V2 Core Link",
    inputSchema,
    async (params) => {
      try {
        const selected = await registry.initialize(params.profile, "links:write");
        const projectId = registry.resolveProject(selected.alias, params.project);
        const { profile: _profile, project: _project, ...options } = params;
        const result = await selected.client.createLink({
          ...options,
          project_id: projectId,
        });
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      } catch (error) {
        return toolError("Error creating link: ", error);
      }
    }
  );
}
