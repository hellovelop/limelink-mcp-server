# 아키텍처

`@limelink/mcp` stdio 서버의 구성 요소와 유지보수 seam을 설명합니다. 사용자 입력·출력 계약은 [기능 참조](../capabilities/README.md), 실행과 외부 통신은 [운영 가이드](../operations/README.md)를 참고합니다.

## 구성 요소

- entry/runtime: `src/index.ts`
- configuration/API: `src/lib/config.ts`, `src/lib/api-client.ts`
- tools: `src/tools/`
- resources: `src/resources/`
- documentation fetch/cache: `src/lib/doc-fetcher.ts`, `src/lib/cache.ts`

## 문서

- [서버 수명주기](./SERVER_LIFECYCLE.md)
- [기능 확장](./EXTENDING.md)

## 핵심 경계

- transport는 stdio만 지원하며 stdout은 protocol channel입니다.
- 도구 6종은 항상 발견되지만 API 실행은 선택 profile을 지연 초기화한 `ApiClient`가 있어야 합니다.
- 문서 리소스는 API key 없이 원격 LimeLink 문서를 조회합니다.
- MCP prompt capability는 등록하지 않습니다.
