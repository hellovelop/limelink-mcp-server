import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { startServer, type TestServer } from "./helpers/server.js";

/**
 * MCP 사용 시나리오 E2E 테스트
 *
 * 개발자가 MCP를 설정한 뒤 딥링크를 연동하는 실제 워크플로우를 검증한다.
 *
 * 시나리오 1: 문서 탐색 → 필요한 가이드 문서를 찾아 읽는 흐름
 * 시나리오 2: 딥링크 SDK 설정 → 프롬프트 기반 가이드 + 문서 리소스 조합
 * 시나리오 3: 다이나믹 링크 생성 → 프롬프트 가이드 → 도구 호출
 * 시나리오 4: 링크 조회 → suffix/URL 기반 링크 조회
 * 시나리오 5: API 키 없이 문서 기반 바이브코딩 → 문서만으로 개발 가능한지 검증
 */

describe("E2E: MCP 사용 시나리오", () => {
  describe("시나리오 1: 문서 탐색 플로우", () => {
    let server: TestServer;

    beforeAll(async () => {
      server = await startServer();
    });

    afterAll(async () => {
      await server.cleanup();
    });

    it("1-1. 문서 인덱스에서 전체 문서 목록을 발견한다", async () => {
      // 개발자가 MCP 연결 후 먼저 llms.txt 인덱스를 읽어 사용 가능한 문서를 파악한다
      const result = await server.client.readResource({
        uri: "limelink://docs/index",
      });

      const text = result.contents[0].text as string;
      expect(text.toLowerCase()).toContain("limelink");
      // llms.txt에는 문서 페이지 링크가 포함되어 있어야 한다
      expect(text.length).toBeGreaterThan(100);
    });

    it("1-2. 리소스 템플릿을 통해 15개 문서 slug를 확인한다", async () => {
      // 리소스 템플릿의 list 콜백으로 모든 문서 slug를 탐색한다
      const { resources } = await server.client.listResources();

      // 정적 리소스(index) + 템플릿으로 등록된 15개 문서 slug
      const docResources = resources.filter((r) =>
        r.uri.startsWith("limelink://docs/")
      );
      // index 1개 + 동적 slug 15개 = 최소 16개
      expect(docResources.length).toBeGreaterThanOrEqual(16);

      // 핵심 문서 slug가 포함되어 있는지 확인
      const uris = docResources.map((r) => r.uri);
      expect(uris).toContain("limelink://docs/index");
      expect(uris).toContain("limelink://docs/introduction");
      expect(uris).toContain("limelink://docs/sdk-integration");
      expect(uris).toContain("limelink://docs/ios-sdk");
      expect(uris).toContain("limelink://docs/android-sdk");
      expect(uris).toContain("limelink://docs/api-integration");
      expect(uris).toContain("limelink://docs/create-link");
      expect(uris).toContain("limelink://docs/dynamic-link");
    });

    it("1-3. SDK 연동 문서를 읽어 딥링크 설정 방법을 파악한다", async () => {
      // 개발자가 SDK 연동 개요 문서를 읽는다
      const result = await server.client.readResource({
        uri: "limelink://docs/sdk-integration",
      });

      const text = result.contents[0].text as string;
      expect(text.length).toBeGreaterThan(0);
      expect(result.contents[0].mimeType).toBe("text/markdown");
    });

    it("1-4. 플랫폼별 SDK 문서를 순차적으로 읽는다", async () => {
      // iOS SDK 문서
      const iosResult = await server.client.readResource({
        uri: "limelink://docs/ios-sdk",
      });
      expect((iosResult.contents[0].text as string).length).toBeGreaterThan(0);

      // Android SDK 문서
      const androidResult = await server.client.readResource({
        uri: "limelink://docs/android-sdk",
      });
      expect(
        (androidResult.contents[0].text as string).length
      ).toBeGreaterThan(0);
    });

    it("1-5. API 연동 문서를 읽어 링크 생성 API 스펙을 파악한다", async () => {
      const result = await server.client.readResource({
        uri: "limelink://docs/api-integration",
      });

      const text = result.contents[0].text as string;
      expect(text.length).toBeGreaterThan(0);
    });

    it("1-6. 링크 생성 가이드 문서를 읽는다", async () => {
      const result = await server.client.readResource({
        uri: "limelink://docs/create-link",
      });

      const text = result.contents[0].text as string;
      expect(text.length).toBeGreaterThan(0);
    });
  });

  describe("시나리오 2: iOS 딥링크 SDK 설정 가이드", () => {
    let server: TestServer;

    beforeAll(async () => {
      server = await startServer();
    });

    afterAll(async () => {
      await server.cleanup();
    });

    it("2-1. setup-deep-linking 프롬프트로 iOS 설정 가이드를 받는다", async () => {
      const result = await server.client.getPrompt({
        name: "setup-deep-linking",
        arguments: { platform: "ios" },
      });

      const content = result.messages[0].content as {
        type: string;
        text: string;
      };

      // iOS SDK 리소스 참조가 포함되어야 한다
      expect(content.text).toContain("limelink://docs/ios-sdk");
      // SDK 연동 개요 리소스 참조도 포함
      expect(content.text).toContain("limelink://docs/sdk-integration");
      // iOS 관련 설정 안내가 포함
      expect(content.text).toContain("iOS");
      expect(content.text).toContain("AppDelegate");
    });

    it("2-2. 프롬프트가 참조하는 문서 리소스를 실제로 읽을 수 있다", async () => {
      // setup-deep-linking 프롬프트가 참조하는 리소스들을 읽어본다
      const sdkResult = await server.client.readResource({
        uri: "limelink://docs/sdk-integration",
      });
      expect((sdkResult.contents[0].text as string).length).toBeGreaterThan(0);

      const iosResult = await server.client.readResource({
        uri: "limelink://docs/ios-sdk",
      });
      expect((iosResult.contents[0].text as string).length).toBeGreaterThan(0);
    });

    it("2-3. Android 설정 가이드도 동일하게 작동한다", async () => {
      const result = await server.client.getPrompt({
        name: "setup-deep-linking",
        arguments: { platform: "android" },
      });

      const content = result.messages[0].content as {
        type: string;
        text: string;
      };

      expect(content.text).toContain("limelink://docs/android-sdk");
      expect(content.text).toContain("Android");
      expect(content.text).toContain("Gradle");
    });

    it("2-4. both 플랫폼은 양쪽 SDK 가이드를 모두 제공한다", async () => {
      const result = await server.client.getPrompt({
        name: "setup-deep-linking",
        arguments: { platform: "both" },
      });

      const content = result.messages[0].content as {
        type: string;
        text: string;
      };

      // 양쪽 리소스 모두 참조
      expect(content.text).toContain("limelink://docs/ios-sdk");
      expect(content.text).toContain("limelink://docs/android-sdk");
      // 크로스 플랫폼 테스트 안내
      expect(content.text).toContain("Cross-Platform Testing");
    });
  });

  describe("시나리오 3: 다이나믹 링크 생성 워크플로우", () => {
    let server: TestServer;

    beforeAll(async () => {
      server = await startServer({
        LIMELINK_PROJECT_ID: "e2e-project",
      });
    });

    afterAll(async () => {
      await server.cleanup();
    });

    it("3-1. create-dynamic-link 프롬프트로 링크 생성 가이드를 받는다", async () => {
      const result = await server.client.getPrompt({
        name: "create-dynamic-link",
        arguments: {
          target_url: "https://myapp.com/product/123",
          suffix: "product-123",
          platforms: "both",
        },
      });

      const content = result.messages[0].content as {
        type: string;
        text: string;
      };

      // 타겟 URL과 suffix가 프롬프트에 반영
      expect(content.text).toContain("https://myapp.com/product/123");
      expect(content.text).toContain("product-123");
      // 양쪽 플랫폼 설정 안내
      expect(content.text).toContain("apple_options");
      expect(content.text).toContain("android_options");
      // create-link 도구 사용 안내
      expect(content.text).toContain("create-link");
      // analytics 설정 안내
      expect(content.text).toContain("stats_flag");
    });

    it("3-2. web 플랫폼은 플랫폼 옵션 없이 간단한 가이드를 제공한다", async () => {
      const result = await server.client.getPrompt({
        name: "create-dynamic-link",
        arguments: {
          target_url: "https://blog.example.com/post/1",
          platforms: "web",
        },
      });

      const content = result.messages[0].content as {
        type: string;
        text: string;
      };

      // 플랫폼 옵션 불필요 안내
      expect(content.text).toContain("No platform-specific options needed");
      // 자동 suffix 생성 안내 (suffix 미제공 시)
      expect(content.text).toContain("Generate an appropriate suffix");
    });

    it("3-3. create-link 도구의 입력 스키마가 올바르게 정의되어 있다", async () => {
      const { tools } = await server.client.listTools();
      const createLink = tools.find((t) => t.name === "create-link");

      expect(createLink).toBeDefined();
      expect(createLink!.inputSchema).toBeDefined();

      const properties = createLink!.inputSchema.properties as Record<
        string,
        unknown
      >;

      // 필수 필드 확인
      expect(properties).toHaveProperty("dynamic_link_suffix");
      expect(properties).toHaveProperty("dynamic_link_url");
      expect(properties).toHaveProperty("dynamic_link_name");
      // 선택 필드 확인
      expect(properties).toHaveProperty("project_id");
      expect(properties).toHaveProperty("stats_flag");
      expect(properties).toHaveProperty("apple_options");
      expect(properties).toHaveProperty("android_options");
      expect(properties).toHaveProperty("additional_options");
    });

    it("3-4. create-link 도구 호출 시 project_id 없으면 env 기본값을 사용한다 (API 에러 예상)", async () => {
      // 실제 API를 호출하므로 인증 에러가 발생하지만,
      // project_id가 env에서 해석되어 API까지 도달하는지 확인한다
      const result = await server.client.callTool({
        name: "create-link",
        arguments: {
          dynamic_link_suffix: "e2e-test",
          dynamic_link_url: "https://example.com",
          dynamic_link_name: "E2E Test Link",
        },
      });

      // test-e2e-key는 유효하지 않으므로 API 에러가 발생하지만,
      // project_id 누락 에러가 아닌 API 레벨 에러여야 한다
      expect(result.isError).toBe(true);
      const text = (result.content as Array<{ type: string; text: string }>)[0]
        .text;
      // project_id required 에러가 아니어야 한다 (env에서 해석됨)
      expect(text).not.toContain("project_id is required");
    });
  });

  describe("시나리오 4: 링크 조회 워크플로우", () => {
    let server: TestServer;

    beforeAll(async () => {
      server = await startServer({
        LIMELINK_PROJECT_ID: "e2e-project",
      });
    });

    afterAll(async () => {
      await server.cleanup();
    });

    it("4-1. get-link-by-suffix 도구로 suffix 기반 조회를 시도한다", async () => {
      const result = await server.client.callTool({
        name: "get-link-by-suffix",
        arguments: {
          suffix: "my-promo-link",
        },
      });

      // 테스트 API 키로 인증 에러가 발생하지만, 정상적으로 도구가 호출됨을 확인
      expect(result.isError).toBe(true);
      const text = (result.content as Array<{ type: string; text: string }>)[0]
        .text;
      // project_id는 env에서 해석되므로 project_id 에러가 아니어야 한다
      expect(text).not.toContain("project_id is required");
    });

    it("4-2. get-link-by-url 도구로 Free 플랜 URL 기반 조회를 시도한다", async () => {
      const result = await server.client.callTool({
        name: "get-link-by-url",
        arguments: {
          url: "https://deep.limelink.org/my-promo-link",
        },
      });

      // 실제 API 호출이므로 인증 에러가 발생하지만, suffix 추출은 성공해야 한다
      expect(result.isError).toBe(true);
      const text = (result.content as Array<{ type: string; text: string }>)[0]
        .text;
      expect(text).not.toContain("Could not extract suffix");
    });

    it("4-3. get-link-by-url 도구로 Pro 플랜 URL 기반 조회를 시도한다", async () => {
      const result = await server.client.callTool({
        name: "get-link-by-url",
        arguments: {
          url: "https://myproject.limelink.org/link/campaign-2024",
        },
      });

      expect(result.isError).toBe(true);
      const text = (result.content as Array<{ type: string; text: string }>)[0]
        .text;
      // Pro URL에서도 suffix 추출이 성공해야 한다
      expect(text).not.toContain("Could not extract suffix");
    });

    it("4-4. 잘못된 URL은 suffix 추출 실패 에러를 반환한다", async () => {
      const result = await server.client.callTool({
        name: "get-link-by-url",
        arguments: {
          url: "https://example.com/not-limelink",
        },
      });

      expect(result.isError).toBe(true);
      const text = (result.content as Array<{ type: string; text: string }>)[0]
        .text;
      expect(text).toContain("Could not extract suffix");
    });
  });

  describe("시나리오 5: API 키 없이 문서 기반 바이브코딩", () => {
    let server: TestServer;

    beforeAll(async () => {
      // API 키 없이 서버 시작 — 문서 리소스와 프롬프트는 사용 가능해야 한다
      server = await startServer({
        LIMELINK_API_KEY: "",
      });
    });

    afterAll(async () => {
      await server.cleanup();
    });

    it("5-1. API 키 없이도 문서 인덱스를 읽을 수 있다", async () => {
      const result = await server.client.readResource({
        uri: "limelink://docs/index",
      });

      const text = result.contents[0].text as string;
      expect(text.length).toBeGreaterThan(0);
      expect(text.toLowerCase()).toContain("limelink");
    });

    it("5-2. API 키 없이도 개별 문서를 읽을 수 있다", async () => {
      const slugs = [
        "introduction",
        "getting-started",
        "dynamic-link",
        "create-link",
        "sdk-integration",
      ];

      for (const slug of slugs) {
        const result = await server.client.readResource({
          uri: `limelink://docs/${slug}`,
        });
        expect(
          (result.contents[0].text as string).length
        ).toBeGreaterThan(0);
      }
    });

    it("5-3. API 키 없이도 프롬프트를 사용할 수 있다", async () => {
      // create-dynamic-link 프롬프트 — 가이드 텍스트 생성은 API 키 불필요
      const createResult = await server.client.getPrompt({
        name: "create-dynamic-link",
        arguments: {
          target_url: "https://myapp.com/page",
          platforms: "ios",
        },
      });
      expect(createResult.messages).toHaveLength(1);
      expect(
        (createResult.messages[0].content as { text: string }).text
      ).toContain("create-link");

      // setup-deep-linking 프롬프트
      const setupResult = await server.client.getPrompt({
        name: "setup-deep-linking",
        arguments: {
          platform: "android",
        },
      });
      expect(setupResult.messages).toHaveLength(1);
      expect(
        (setupResult.messages[0].content as { text: string }).text
      ).toContain("limelink://docs/android-sdk");
    });

    it("5-4. API 키 없이 도구 호출 시 명확한 에러 메시지를 반환한다", async () => {
      const result = await server.client.callTool({
        name: "create-link",
        arguments: {
          dynamic_link_suffix: "test",
          dynamic_link_url: "https://example.com",
          dynamic_link_name: "Test",
        },
      });

      expect(result.isError).toBe(true);
      const text = (result.content as Array<{ type: string; text: string }>)[0]
        .text;
      expect(text).toContain("LIMELINK_API_KEY");
    });

    it("5-5. 문서 → 프롬프트 → 도구 순서의 전체 흐름을 API 키 없이 탐색한다", async () => {
      // Step 1: 문서 인덱스로 전체 구조 파악
      const indexResult = await server.client.readResource({
        uri: "limelink://docs/index",
      });
      expect((indexResult.contents[0].text as string).length).toBeGreaterThan(
        0
      );

      // Step 2: 딥링크 개념 문서 읽기
      const dlResult = await server.client.readResource({
        uri: "limelink://docs/dynamic-link",
      });
      expect((dlResult.contents[0].text as string).length).toBeGreaterThan(0);

      // Step 3: SDK 연동 가이드 프롬프트 사용
      const promptResult = await server.client.getPrompt({
        name: "setup-deep-linking",
        arguments: { platform: "ios" },
      });
      const promptText = (
        promptResult.messages[0].content as { text: string }
      ).text;
      expect(promptText).toContain("limelink://docs/ios-sdk");

      // Step 4: 프롬프트가 참조하는 iOS SDK 문서 읽기
      const iosResult = await server.client.readResource({
        uri: "limelink://docs/ios-sdk",
      });
      expect((iosResult.contents[0].text as string).length).toBeGreaterThan(0);

      // Step 5: 링크 생성 가이드 프롬프트 사용
      const createPromptResult = await server.client.getPrompt({
        name: "create-dynamic-link",
        arguments: {
          target_url: "https://myapp.com/product/1",
          suffix: "product-1",
          platforms: "ios",
        },
      });
      const createText = (
        createPromptResult.messages[0].content as { text: string }
      ).text;
      expect(createText).toContain("create-link");
      expect(createText).toContain("apple_options");

      // Step 6: 도구 호출 시 API 키 필요 안내 (개발자가 키 설정 필요함을 인지)
      const toolResult = await server.client.callTool({
        name: "create-link",
        arguments: {
          dynamic_link_suffix: "product-1",
          dynamic_link_url: "https://myapp.com/product/1",
          dynamic_link_name: "Product 1",
        },
      });
      expect(toolResult.isError).toBe(true);
      expect(
        (toolResult.content as Array<{ type: string; text: string }>)[0].text
      ).toContain("LIMELINK_API_KEY");
    });
  });

  describe("시나리오 6: MCP 서버 기능 종합 검증", () => {
    let server: TestServer;

    beforeAll(async () => {
      server = await startServer({
        LIMELINK_PROJECT_ID: "e2e-project",
      });
    });

    afterAll(async () => {
      await server.cleanup();
    });

    it("6-1. 도구, 리소스, 프롬프트가 모두 정상 등록되어 있다", async () => {
      const [toolsResult, resourcesResult, promptsResult] = await Promise.all([
        server.client.listTools(),
        server.client.listResources(),
        server.client.listPrompts(),
      ]);

      // 도구 3개
      expect(toolsResult.tools).toHaveLength(3);
      // 리소스: index(1) + slug(15) = 16개 이상
      expect(resourcesResult.resources.length).toBeGreaterThanOrEqual(16);
      // 프롬프트 2개
      expect(promptsResult.prompts).toHaveLength(2);
    });

    it("6-2. 리소스 템플릿이 동적 문서 조회를 지원한다", async () => {
      const { resourceTemplates } =
        await server.client.listResourceTemplates();

      const docsTemplate = resourceTemplates.find(
        (t) => t.uriTemplate === "limelink://docs/{slug}"
      );
      expect(docsTemplate).toBeDefined();
      expect(docsTemplate!.name).toBeTruthy();
    });

    it("6-3. 모든 도구에 필수 입력 필드가 명시되어 있다", async () => {
      const { tools } = await server.client.listTools();

      for (const tool of tools) {
        const schema = tool.inputSchema;
        expect(schema.type).toBe("object");
        expect(schema.required).toBeDefined();
        expect((schema.required as string[]).length).toBeGreaterThan(0);
      }
    });

    it("6-4. 존재하지 않는 문서 slug에 대해 명확한 에러를 반환한다", async () => {
      await expect(
        server.client.readResource({
          uri: "limelink://docs/invalid-page",
        })
      ).rejects.toThrow();
    });
  });
});
