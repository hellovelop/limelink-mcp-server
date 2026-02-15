import { describe, it, expect } from "vitest";
import { registerCreateLinkPrompt } from "../../../src/prompts/create-link-prompt.js";
import { createMockMcpServer, extractPromptHandler } from "../../mocks/server.js";

describe("registerCreateLinkPrompt", () => {
  function setup() {
    const server = createMockMcpServer();
    registerCreateLinkPrompt(server as any);
    return { server, handler: extractPromptHandler(server) };
  }

  it("올바른 이름으로 프롬프트를 등록한다", () => {
    const { server } = setup();
    expect(server.prompt).toHaveBeenCalledWith(
      "create-dynamic-link",
      expect.any(String),
      expect.any(Object),
      expect.any(Function)
    );
  });

  describe("platform별 안내", () => {
    it("ios 플랫폼은 apple_options 설정 안내를 포함한다", () => {
      const { handler } = setup();
      const result = handler({
        target_url: "https://example.com",
        platforms: "ios",
      }) as any;

      const text = result.messages[0].content.text;
      expect(text).toContain("apple_options");
      expect(text).toContain("App Store");
    });

    it("android 플랫폼은 android_options 설정 안내를 포함한다", () => {
      const { handler } = setup();
      const result = handler({
        target_url: "https://example.com",
        platforms: "android",
      }) as any;

      const text = result.messages[0].content.text;
      expect(text).toContain("android_options");
      expect(text).toContain("Play Store");
    });

    it("both 플랫폼은 양쪽 모두 안내한다", () => {
      const { handler } = setup();
      const result = handler({
        target_url: "https://example.com",
        platforms: "both",
      }) as any;

      const text = result.messages[0].content.text;
      expect(text).toContain("apple_options");
      expect(text).toContain("android_options");
    });

    it("web 플랫폼은 플랫폼별 옵션 불필요 안내를 포함한다", () => {
      const { handler } = setup();
      const result = handler({
        target_url: "https://example.com",
        platforms: "web",
      }) as any;

      const text = result.messages[0].content.text;
      expect(text).toContain("No platform-specific options");
    });
  });

  describe("suffix 처리", () => {
    it("suffix 제공 시 해당 suffix 사용 안내를 포함한다", () => {
      const { handler } = setup();
      const result = handler({
        target_url: "https://example.com",
        suffix: "my-promo",
        platforms: "web",
      }) as any;

      const text = result.messages[0].content.text;
      expect(text).toContain('"my-promo"');
    });

    it("suffix 미제공 시 자동 생성 안내를 포함한다", () => {
      const { handler } = setup();
      const result = handler({
        target_url: "https://example.com",
        platforms: "web",
      }) as any;

      const text = result.messages[0].content.text;
      expect(text).toContain("Generate an appropriate suffix");
    });
  });

  describe("메시지 구조", () => {
    it("올바른 MCP 메시지 구조를 반환한다", () => {
      const { handler } = setup();
      const result = handler({
        target_url: "https://example.com",
        platforms: "ios",
      }) as any;

      expect(result.messages).toHaveLength(1);
      expect(result.messages[0].role).toBe("user");
      expect(result.messages[0].content.type).toBe("text");
      expect(typeof result.messages[0].content.text).toBe("string");
    });

    it("target_url이 메시지에 포함된다", () => {
      const { handler } = setup();
      const result = handler({
        target_url: "https://my-site.com/page",
        platforms: "web",
      }) as any;

      expect(result.messages[0].content.text).toContain(
        "https://my-site.com/page"
      );
    });
  });
});
