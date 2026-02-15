import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const argsSchema = {
  platform: z
    .enum(["ios", "android", "both"])
    .describe("Target platform(s) for deep link SDK setup"),
};

export function registerDeepLinkPrompt(server: McpServer): void {
  server.prompt(
    "setup-deep-linking",
    "Guide for setting up Limelink SDK deep linking on iOS and/or Android",
    argsSchema,
    ({ platform }) => {
      const resources: string[] = [];
      let platformGuide: string;

      switch (platform) {
        case "ios":
          resources.push("limelink://docs/ios-sdk");
          platformGuide = `## iOS Setup

1. Read the iOS SDK documentation using the \`limelink://docs/ios-sdk\` resource.
2. Follow the SDK integration steps:
   - Install the LimeLink iOS SDK via CocoaPods or Swift Package Manager
   - Configure the URL scheme and associated domains
   - Initialize the SDK in your AppDelegate
   - Handle incoming deep links in your app
3. Test deep link handling using a dynamic link created with the \`create-link\` tool.`;
          break;
        case "android":
          resources.push("limelink://docs/android-sdk");
          platformGuide = `## Android Setup

1. Read the Android SDK documentation using the \`limelink://docs/android-sdk\` resource.
2. Follow the SDK integration steps:
   - Add the LimeLink Android SDK dependency via Gradle
   - Configure intent filters in AndroidManifest.xml
   - Initialize the SDK in your Application class
   - Handle incoming deep links in your Activity
3. Test deep link handling using a dynamic link created with the \`create-link\` tool.`;
          break;
        case "both":
          resources.push("limelink://docs/ios-sdk", "limelink://docs/android-sdk");
          platformGuide = `## iOS Setup

1. Read the iOS SDK documentation using the \`limelink://docs/ios-sdk\` resource.
2. Follow the SDK integration steps:
   - Install the LimeLink iOS SDK via CocoaPods or Swift Package Manager
   - Configure the URL scheme and associated domains
   - Initialize the SDK in your AppDelegate
   - Handle incoming deep links in your app

## Android Setup

1. Read the Android SDK documentation using the \`limelink://docs/android-sdk\` resource.
2. Follow the SDK integration steps:
   - Add the LimeLink Android SDK dependency via Gradle
   - Configure intent filters in AndroidManifest.xml
   - Initialize the SDK in your Application class
   - Handle incoming deep links in your Activity

## Cross-Platform Testing

Test deep link handling on both platforms using dynamic links created with the \`create-link\` tool.`;
          break;
      }

      return {
        messages: [
          {
            role: "user" as const,
            content: {
              type: "text" as const,
              text: `Set up Limelink deep linking for ${platform === "both" ? "iOS and Android" : platform}.

## Prerequisites

- Read the SDK integration overview from \`limelink://docs/sdk-integration\` resource first.
- Ensure you have a Limelink project with registered applications for your target platform(s).

${platformGuide}

## Available Resources

The following documentation resources can help:
${resources.map((r) => `- \`${r}\``).join("\n")}
- \`limelink://docs/sdk-integration\` — General SDK integration overview
- \`limelink://docs/dynamic-link\` — Dynamic link concepts
- \`limelink://docs/create-link\` — Link creation guide`,
            },
          },
        ],
      };
    }
  );
}
