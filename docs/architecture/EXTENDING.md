# 기능 확장

## 새 도구 추가

1. `src/tools/<name>.ts`에 Zod schema와 registration function을 작성합니다.
2. 필요한 경우 `McpServer`, `ApiClient | null`, `Config`를 받습니다.
3. API key와 프로젝트 ID fallback 및 plain-text 오류 계약을 유지합니다.
4. `src/tools/index.ts`에서 import하고 `registerTools()`에 추가합니다.
5. `tests/unit/tools/`에 schema와 handler test를 추가합니다.
6. E2E의 tool name/count/schema assertion과 README/capability 문서를 갱신합니다.

handler를 직접 호출하는 mock test는 MCP의 Zod validation을 거치지 않습니다. schema 변경은 등록된 schema를 Zod object로 parse하거나 실제 MCP E2E로 검증해야 합니다.

## 새 리소스 유형 추가

1. `src/resources/`에 registration function을 구현합니다.
2. `src/resources/index.ts`에서 조합합니다.
3. unit test에서 metadata와 content handler를 검증합니다.
4. E2E에서 discovery, template과 read 동작을 검증합니다.
5. capability 문서와 기능 개수를 갱신합니다.

## 문서 slug 추가

1. `https://limelink.org/md/{slug}.md`가 존재하는지 확인합니다.
2. `src/lib/doc-fetcher.ts`의 `VALID_SLUGS`에 추가합니다. 이 배열이 `DocSlug`, validator와 discovery list의 source of truth입니다.
3. `docs/capabilities/RESOURCES.md`의 목록을 갱신합니다.
4. unit/E2E에서 15 pages와 16 concrete URI를 전제로 하는 assertion을 새 개수로 변경합니다.
5. fetch URL, listing metadata와 invalid slug 동작을 검증합니다.

## 캐시 변경

각 `DocFetcher`는 process-local cache를 독립적으로 소유합니다. 성공 응답만 저장하고 index는 `llms.txt`, page는 `doc:{slug}` key를 사용합니다. expiry는 다음 조회 시 lazy 처리됩니다.

- 기본 TTL 변경: `src/lib/cache.ts`, fake-timer unit test, resource/operations 문서를 함께 갱신
- key 전략 변경: index/page 및 slug 간 cache isolation test 추가
- runtime invalidation 추가: private `DocFetcher.cache`를 직접 우회하지 말고 명시적 API 또는 dependency injection 설계

`TTLCache.delete/clear`는 public method지만 현재 `DocFetcher` 외부에서 cache에 접근할 수 없으므로 server operation으로 제공되지 않습니다.

## 기능 제거

aggregator, unit/E2E count, README, capability 문서와 필요 시 `server.json`을 함께 갱신합니다. TypeScript build는 제거된 source의 기존 output을 자동 정리하지 않으므로 pack 전에 `dist`의 stale artifact를 제거하거나 clean build를 수행합니다.

## 검증 체크리스트

```bash
rm -rf dist
pnpm run build
pnpm test
pnpm test:e2e
npm pack --dry-run
dotdotgod validate . --include-local-memory --check-index
git diff --check
```

pack 목록과 저장소 전체에서 제거된 identifier가 남지 않았는지도 검색합니다.
