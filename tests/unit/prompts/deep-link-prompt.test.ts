import { describe, it, expect } from "vitest";
import { registerDeepLinkPrompt } from "../../../src/prompts/deep-link-prompt.js";
import { createMockMcpServer, extractPromptHandler } from "../../mocks/server.js";

describe("registerDeepLinkPrompt", () => {
  function setup() {
    const server = createMockMcpServer();
    registerDeepLinkPrompt(server as any);
    return { server, handler: extractPromptHandler(server) };
  }

  it("올바른 이름으로 프롬프트를 등록한다", () => {
    const { server } = setup();
    expect(server.prompt).toHaveBeenCalledWith(
      "setup-deep-linking",
      expect.any(String),
      expect.any(Object),
      expect.any(Function)
    );
  });

  describe("platform별 안내", () => {
    it("ios 플랫폼은 iOS SDK 리소스를 포함한다", () => {
      const { handler } = setup();
      const result = handler({ platform: "ios" }) as any;

      const text = result.messages[0].content.text;
      expect(text).toContain("limelink://docs/ios-sdk");
      expect(text).toContain("CocoaPods");
      expect(text).toContain("AppDelegate");
      expect(text).not.toContain("limelink://docs/android-sdk");
    });

    it("android 플랫폼은 Android SDK 리소스를 포함한다", () => {
      const { handler } = setup();
      const result = handler({ platform: "android" }) as any;

      const text = result.messages[0].content.text;
      expect(text).toContain("limelink://docs/android-sdk");
      expect(text).toContain("Gradle");
      expect(text).toContain("AndroidManifest.xml");
      expect(text).not.toContain("limelink://docs/ios-sdk");
    });

    it("both 플랫폼은 양쪽 리소스를 모두 포함한다", () => {
      const { handler } = setup();
      const result = handler({ platform: "both" }) as any;

      const text = result.messages[0].content.text;
      expect(text).toContain("limelink://docs/ios-sdk");
      expect(text).toContain("limelink://docs/android-sdk");
      expect(text).toContain("Cross-Platform Testing");
    });
  });

  describe("공통 리소스", () => {
    it("sdk-integration 리소스를 항상 포함한다", () => {
      const platforms = ["ios", "android", "both"] as const;

      for (const platform of platforms) {
        const { handler } = setup();
        const result = handler({ platform }) as any;
        const text = result.messages[0].content.text;
        expect(text).toContain("limelink://docs/sdk-integration");
      }
    });

    it("dynamic-link, create-link 리소스를 항상 포함한다", () => {
      const { handler } = setup();
      const result = handler({ platform: "ios" }) as any;
      const text = result.messages[0].content.text;

      expect(text).toContain("limelink://docs/dynamic-link");
      expect(text).toContain("limelink://docs/create-link");
    });
  });

  describe("메시지 구조", () => {
    it("올바른 MCP 메시지 구조를 반환한다", () => {
      const { handler } = setup();
      const result = handler({ platform: "ios" }) as any;

      expect(result.messages).toHaveLength(1);
      expect(result.messages[0].role).toBe("user");
      expect(result.messages[0].content.type).toBe("text");
    });

    it("both 플랫폼은 'iOS and Android'를 포함한다", () => {
      const { handler } = setup();
      const result = handler({ platform: "both" }) as any;

      expect(result.messages[0].content.text).toContain("iOS and Android");
    });
  });
});
