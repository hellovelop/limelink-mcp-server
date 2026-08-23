# 네트워크 동작

선택된 profile마다 별도 `ApiClient`, `X-API-KEY`, 초기화 state와 cache가 사용됩니다. 배포 runtime origin은 `https://api.limelink.org`로 고정됩니다. 단위 테스트는 mock fetch, 개발 통합 검증은 내부 origin seam으로 `https://api.dev.limelink.org`를 사용합니다.

## 지연 profile 초기화

API-backed 도구는 선택된 profile이 아직 초기화되지 않았을 때만 다음을 호출합니다.

```text
GET /api/v2/api-credentials/current
```

성공한 credential context와 scopes는 alias별 process-lifetime cache에 저장됩니다. 같은 alias의 동시 최초 호출은 하나의 in-flight 요청을 공유합니다. 실패는 cache하지 않아 재시도할 수 있습니다. `list-profiles`는 network를 호출하지 않고 이미 초기화된 profile에만 scopes를 표시합니다.

## Link와 discovery 호출

- V2 생성: `POST /api/v2/core/link` (`links:write`)
- Project 목록: `GET /api/v2/organizations/{organization_id}/projects` (`projects:read`)
- Custom Domain 목록: `GET /api/v2/organizations/{organization_id}/projects/{project_id}/custom-domains` (`domains:read`)
- V2 URL 조회: `GET /api/v2/links/resolve?url=...` (`links:read`)
- 기존 suffix 조회: `GET /api/v1/dynamic-link/{project_id}` (`links:read`)

V1 링크 생성은 존재하지 않습니다. `get-link-by-url`은 Project discovery나 local parsing 없이 full URL을 V2 resolver에 전달합니다. `get-link-by-suffix`만 별도 migration 전까지 V1 endpoint를 유지합니다. Organization ID는 profile 파일이 아닌 introspection 응답에서 얻으며 API-backed 응답에는 노출될 수 있습니다. `project` alias는 선택 profile 안에서 UUID로 해석하며 alias가 없으면 UUID를 직접 받습니다.

## 오류

공식 JSON API 오류 body는 HTTP status와 함께 에이전트에 전달합니다. `message`의 string 또는 string-array 형태를 보존합니다. JSON이 아닌 body는 최대 64 KiB까지 전달합니다. API key를 local wrapper가 body에 추가하지 않습니다.

현재 timeout, retry와 backoff는 없습니다. 네트워크 오류는 도구 오류로 반환됩니다.
