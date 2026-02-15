import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { startServer, type TestServer } from "./helpers/server.js";

describe("E2E: Prompts", () => {
  let server: TestServer;

  beforeAll(async () => {
    server = await startServer();
  });

  afterAll(async () => {
    await server.cleanup();
  });

  describe("프롬프트 목록", () => {
    it("2개의 프롬프트가 등록되어 있다", async () => {
      const { prompts } = await server.client.listPrompts();

      expect(prompts).toHaveLength(2);

      const names = prompts.map((p) => p.name);
      expect(names).toContain("create-dynamic-link");
      expect(names).toContain("setup-deep-linking");
    });

    it("각 프롬프트에 설명이 있다", async () => {
      const { prompts } = await server.client.listPrompts();

      for (const prompt of prompts) {
        expect(prompt.description).toBeTruthy();
      }
    });
  });

  describe("create-dynamic-link 프롬프트", () => {
    it("ios 플랫폼 인자로 호출하면 apple_options 안내를 포함한다", async () => {
      const result = await server.client.getPrompt({
        name: "create-dynamic-link",
        arguments: {
          target_url: "https://example.com/product",
          platforms: "ios",
        },
      });

      expect(result.messages).toHaveLength(1);
      expect(result.messages[0].role).toBe("user");

      const content = result.messages[0].content as { type: string; text: string };
      expect(content.type).toBe("text");
      expect(content.text).toContain("apple_options");
      expect(content.text).toContain("https://example.com/product");
    });

    it("suffix를 제공하면 해당 suffix 안내를 포함한다", async () => {
      const result = await server.client.getPrompt({
        name: "create-dynamic-link",
        arguments: {
          target_url: "https://example.com",
          suffix: "my-custom",
          platforms: "web",
        },
      });

      const content = result.messages[0].content as { type: string; text: string };
      expect(content.text).toContain("my-custom");
    });
  });

  describe("setup-deep-linking 프롬프트", () => {
    it("both 플랫폼 인자로 호출하면 양쪽 SDK 리소스를 포함한다", async () => {
      const result = await server.client.getPrompt({
        name: "setup-deep-linking",
        arguments: {
          platform: "both",
        },
      });

      const content = result.messages[0].content as { type: string; text: string };
      expect(content.text).toContain("limelink://docs/ios-sdk");
      expect(content.text).toContain("limelink://docs/android-sdk");
      expect(content.text).toContain("iOS and Android");
    });
  });
});
