# 서버 수명주기

## 메타데이터 생성

`createMcpServer()`는 MCP server name `limelink`와 package version을 설정합니다. version은 `import.meta.url`에서 한 단계 위의 `package.json`을 읽으므로 호출자의 working directory와 무관합니다. compiled entry의 깊이를 바꾸면 이 상대 경로 계약도 갱신해야 합니다.

## Production startup

`src/index.ts`의 startup 순서는 다음과 같습니다.

1. `loadConfig()`가 `LIMELINK_PROFILES_FILE`을 읽고 profile map을 만듭니다.
2. profile별 `ApiClient`와 credential initialization state/cache를 소유하는 `ProfileRegistry`를 만듭니다.
3. 독립 cache를 소유하는 `DocFetcher`를 만듭니다.
4. `McpServer`를 생성합니다.
5. 도구 6종에 registry를 전달해 등록합니다.
6. 문서 리소스에 fetcher를 전달해 등록합니다.
7. `StdioServerTransport`를 만들고 연결합니다.

## 선택된 profile credential 유무

도구는 profile 유무와 관계없이 discovery에 나타납니다. `list-profiles`는 네트워크 없이 로컬 설정과 현재 initialization 상태만 반환합니다. API 도구는 registry가 explicit alias, 설정된 default, 유일한 profile 순서로 선택합니다. 선택 profile이 처음 사용되면 credential introspection을 single-flight로 수행하고 성공 context와 scopes를 alias별로 cache합니다. 실패는 cache하지 않습니다. Project selector는 선택 profile의 local alias 또는 직접 UUID로 해석합니다. 문서 리소스는 profile 없이 동작합니다.

## `createSandboxServer()`

이 export는 server construction과 test를 위한 helper입니다.

- production config를 읽지 않습니다.
- 빈 profile map을 소유하는 `ProfileRegistry`를 전달합니다.
- 도구는 등록되지만 API 도구 호출은 profile 설정 오류를 반환합니다.
- 실제 `DocFetcher`를 등록하므로 resource read는 `limelink.org`에 요청할 수 있습니다.
- transport를 연결하지 않으며 호출자가 연결을 소유합니다.

현재 entry module은 import될 때 `main()`도 실행하므로 이 factory를 일반 application embedding용 side-effect-free API로 보장하지 않습니다. 별도 module 분리나 direct-execution guard 전에는 construction/test helper로만 취급합니다.

## Transport와 출력

production은 stdio transport만 사용합니다. stdout은 MCP JSON-RPC frame 전용이며 진단 정보는 stderr로 보내야 합니다.

## Fatal flow

startup 또는 transport 연결 promise가 reject되면 `Fatal error:`와 원인을 stderr에 기록하고 exit code 1로 종료합니다. 개별 tool/resource handler 오류는 MCP request 오류이며 항상 process fatal을 뜻하지 않습니다.

## 검증 위치

- 공개 기능과 prompt 부재: `tests/e2e/scenarios.e2e.test.ts`
- API key 없는 동작: `tests/e2e/no-api-key.e2e.test.ts`
- foreign working directory와 version: `tests/e2e/runtime.e2e.test.ts`
