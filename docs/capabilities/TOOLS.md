# MCP Tools

서버는 항상 도구 6종을 등록합니다.

## 공통 profile 초기화와 Project 선택

API-backed 도구는 optional `profile` alias를 받습니다. explicit alias → `defaultProfile` → 유일한 profile 순으로 선택합니다. 선택된 profile이 아직 초기화되지 않았으면 `GET /api/v2/api-credentials/current`를 한 번 호출하고 credential context와 scopes를 alias별 process-lifetime cache에 저장합니다. 동시 최초 호출은 같은 요청을 공유하고 실패는 cache하지 않습니다.

Project가 필요한 도구는 필수 `project`를 받습니다. Project UUID 직접 입력이 기본이며, 선택 profile의 Project alias도 사용할 수 있습니다. Project alias map은 반복 사용하는 Project를 위한 선택적 권장 편의 기능입니다. `list-projects`로 UUID를 확인한 뒤 필요할 때만 alias를 추가하며, alias가 없어도 모든 Project-backed 도구가 동작합니다.

## `list-profiles`

네트워크 호출 없이 로컬 alias, `organizationLabel`, default 여부와 현재 initialization 상태를 반환합니다. 이미 초기화된 profile만 scopes를 포함합니다. API key 원문은 반환하지 않습니다. Organization, Project, Custom Domain, credential 식별자와 key prefix는 비-secret 식별자로 분류하며 필요한 API-backed 도구 응답에 포함될 수 있습니다.

## `list-projects`

입력: optional `profile`. `projects:read`가 필요합니다. 초기화된 credential의 Organization ID로 프로젝트를 조회하고 각 Project에 일치하는 로컬 alias 배열을 덧붙입니다.

## `list-custom-domains`

필수: alias 또는 UUID인 `project`. 선택: `profile`. `domains:read`가 필요하며 선택 Project의 Custom Domain 목록을 반환합니다.

## `create-link`

V2 Core Link만 생성합니다. 필수: `project`, URL인 `dynamic_link_url`, `dynamic_link_name`. 선택: 1~100자의 `dynamic_link_suffix`, `custom_domain_id`, `stats_flag`, 공식 Apple/Android/application/advanced/not-installed/additional options. `links:write`가 필요합니다. suffix를 생략하면 API가 생성합니다.

## `get-link-by-suffix`

필수: `suffix`, alias 또는 UUID인 `project`. 선택: `profile`. `links:read`가 필요합니다. 조회 호출은 기존 V1 조회 endpoint를 사용합니다.

## `get-link-by-url`

필수: 최대 2048자의 absolute LimeLink HTTPS `url`. 선택: `profile`. `links:read`가 필요합니다. `GET /api/v2/links/resolve`가 Free, Project hostname 또는 활성 Custom Domain의 exact hostname과 suffix namespace를 판별합니다. `project` 입력과 MCP의 local suffix parser는 사용하지 않습니다. query, fragment, explicit port, credentials, 빈 suffix와 다중 path는 upstream `400`입니다.

공식 JSON API 오류 body는 HTTP status와 함께 MCP error content로 전달됩니다. JSON이 아닌 body는 최대 64 KiB까지 전달합니다. timeout과 retry는 제공하지 않습니다.
