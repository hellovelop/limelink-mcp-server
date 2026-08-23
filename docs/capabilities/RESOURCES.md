# 문서 리소스 참조

문서 원문은 이 저장소에 포함되지 않습니다. 서버가 `https://limelink.org`에서 실행 시 가져오며 API 키는 필요하지 않습니다.

## `limelink://docs/index`

- 구현 유형: 정적 MCP 리소스
- MCP name: `docs-index`
- 원격 출처: `https://limelink.org/llms.txt`
- MIME type: `text/plain`
- 역할: 사용 가능한 LimeLink 문서를 찾기 위한 인덱스

`llms.txt`는 개별 문서 본문을 저장한 프로젝트 파일이 아니라 원격 문서 인덱스입니다.

## `limelink://docs/{slug}`

- 구현 유형: MCP 리소스 템플릿
- MCP name: `docs-page`
- 원격 출처: `https://limelink.org/md/{slug}.md`
- MIME type: `text/markdown`
- 역할: 선택한 개별 문서의 Markdown 본문 제공

지원 slug:

- `introduction`
- `getting-started`
- `project`
- `application`
- `dynamic-link`
- `create-link`
- `link-detail`
- `link-management`
- `appearance`
- `sdk-integration`
- `ios-sdk`
- `android-sdk`
- `api-integration`
- `advanced`
- `llm-agent`

허용 목록 밖의 slug는 원격 요청 전에 오류를 반환하며 오류에 유효한 slug 목록을 포함합니다. 리소스 목록에는 index와 템플릿의 15개 페이지가 열거되므로 16개 concrete URI를 발견할 수 있지만 구현 유형은 정적 리소스와 템플릿 2종입니다.

## 캐시

- 각 `DocFetcher` 인스턴스가 독립적인 인메모리 캐시를 가집니다.
- index key는 `llms.txt`, 페이지 key는 `doc:{slug}`입니다.
- 성공적으로 가져온 텍스트만 1시간 보관합니다.
- 캐시는 프로세스 간 공유되거나 디스크에 영속화되지 않습니다.
- 만료 항목은 background sweep이 아니라 다음 조회 때 제거됩니다.
- 실패 응답과 network exception은 캐시하지 않습니다.
- 현재 빈 문자열 응답은 저장되지만 truthy cache lookup 때문에 다음 요청에서 cache hit로 사용되지 않습니다.

## 실패와 네트워크 제한

- index non-2xx: `Failed to fetch llms.txt: HTTP {status}`
- 페이지 non-2xx: `Failed to fetch document '{slug}': HTTP {status}`
- native fetch/network exception은 별도 변환 없이 전파됩니다.
- 응답 `Content-Type`은 검증하지 않습니다.
- 명시적 timeout, AbortSignal, retry, backoff와 rate-limit 전용 처리가 없습니다.

상세한 외부 연결과 운영상 주의사항은 [네트워크 동작](../operations/NETWORK_BEHAVIOR.md)을 참고합니다.
