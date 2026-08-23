# @limelink/mcp

[![npm version](https://img.shields.io/npm/v/%40limelink%2Fmcp.svg)](https://www.npmjs.com/package/@limelink/mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[English](./README.md) · [전체 문서](https://github.com/hellovelop/limelink-mcp-server/blob/main/docs/README.md) · [기능 참조](https://github.com/hellovelop/limelink-mcp-server/blob/main/docs/capabilities/README.md)

[LimeLink](https://limelink.org) 다이나믹 링크 관리를 위한 [Model Context Protocol (MCP)](https://modelcontextprotocol.io) 서버입니다. Claude Code, Claude Desktop 등 MCP 호환 클라이언트에서 다이나믹 링크를 직접 생성하고 조회할 수 있습니다.

> **API 키 없이 바로 시작할 수 있습니다!** 문서 조회와 SDK 설정 가이드는 별도 설정 없이 사용 가능합니다. 연결만 하면 AI 어시스턴트에서 LimeLink의 기능을 바로 탐색할 수 있습니다.

## 기능

- **문서 리소스** — LimeLink 문서 15페이지 + 인덱스를 AI 어시스턴트에서 직접 접근 — **API 키 불필요**
- **5개 도구** — 프로필·프로젝트 탐색, 다이나믹 링크 생성과 조회 (API 도구는 설정된 프로필 필요)
- **인메모리 캐싱** — 문서 fetch에 1시간 TTL 캐시 적용

### 실행 환경

- Node.js 18 이상
- stdio 전송만 지원하며 Remote MCP/HTTP 전송은 지원하지 않음
- npm 패키지명: `@limelink/mcp`; 글로벌 실행 파일: `limelink-mcp`
- stdout은 MCP 프로토콜 전용이며 진단 및 wrapper 로그는 stderr 사용

전체 운영 계약은 [설치 및 설정](https://github.com/hellovelop/limelink-mcp-server/blob/main/docs/operations/CONFIGURATION.md)과 [네트워크 동작](https://github.com/hellovelop/limelink-mcp-server/blob/main/docs/operations/NETWORK_BEHAVIOR.md)을 참고하세요.

### API 키 없이 사용 가능한 기능

| 기능 | 카테고리 | API 키 | 설명 |
|------|---------|:------:|------|
| `limelink://docs/index` | Resource | 불필요 | 전체 문서 인덱스 |
| `limelink://docs/{slug}` | Resource | 불필요 | 15개 개별 문서 페이지 |
| `list-profiles` | Tool | 불필요 | API 호출 없이 로컬 profile alias 목록 조회 |
| `list-projects` | Tool | **필요** | 선택한 Organization profile의 Project 목록 조회 |
| `list-custom-domains` | Tool | **필요** | 선택 Project의 Custom Domain 목록 조회 |
| `create-link` | Tool | **필요** | API를 통한 V2 Core Link 생성 |
| `get-link-by-suffix` | Tool | **필요** | suffix로 링크 조회 |
| `get-link-by-url` | Tool | **필요** | URL로 링크 조회 |

## 빠른 시작

### API 키 없이 사용 (문서 & 가이드)

API 키 없이 바로 연결하여 LimeLink 문서와 설정 가이드를 탐색할 수 있습니다:

```json
{
  "mcpServers": {
    "limelink": {
      "command": "npx",
      "args": ["-y", "@limelink/mcp"]
    }
  }
}
```

AI 어시스턴트에게 이렇게 물어보세요:
- "LimeLink 시작하기 문서를 읽어줘"
- "iOS 딥링크 설정은 어떻게 해?"
- "LimeLink SDK 연동 가이드를 보여줘"

### API 키로 사용 (전체 기능)

API 키를 추가하면 링크 생성 및 관리 도구를 사용할 수 있습니다:

```json
{
  "mcpServers": {
    "limelink": {
      "command": "npx",
      "args": ["-y", "@limelink/mcp"],
      "env": {
        "LIMELINK_PROFILES_FILE": "/absolute/path/to/limelink-profiles.json"
      }
    }
  }
}
```

### 글로벌 설치로 사용

```bash
npm install -g @limelink/mcp
```

```json
{
  "mcpServers": {
    "limelink": {
      "command": "limelink-mcp",
      "env": {
        "LIMELINK_PROFILES_FILE": "/absolute/path/to/limelink-profiles.json"
      }
    }
  }
}
```

## 설정

### Claude Code

`claude mcp add` 명령어로 간편하게 추가할 수 있습니다:

```bash
# API 키 없이 (문서 & 가이드만)
claude mcp add --scope user --transport stdio limelink -- npx -y @limelink/mcp

# API 키 포함 (전체 기능)
claude mcp add --scope user --transport stdio limelink \
  --env LIMELINK_PROFILES_FILE=/absolute/path/to/limelink-profiles.json \
  -- npx -y @limelink/mcp
```

**스코프 옵션:**
- `--scope user` — 모든 프로젝트에서 사용 가능
- `--scope project` — `.mcp.json`에 저장 (Git으로 팀과 공유 가능)

### Claude Desktop 및 기타 MCP 클라이언트

클라이언트 설정 파일에 JSON 설정을 추가하세요:

| 클라이언트 | 설정 파일 |
|-----------|----------|
| Claude Desktop (macOS) | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Claude Desktop (Windows) | `%APPDATA%\Claude\claude_desktop_config.json` |

### Profile 파일

```json
{"version":1,"defaultProfile":"work","profiles":{"work":{"apiKey":"your_api_key","organizationLabel":"Work","projects":{"marketing":"11111111-1111-4111-8111-111111111111"}}}}
```

### 환경변수

| 변수 | 필수 | 기본값 | 설명 |
|------|------|--------|------|
| `LIMELINK_PROFILES_FILE` | N | — | 이름이 있는 Organization credential profile을 담은 version 1 JSON 파일 경로 |

`LIMELINK_API_KEY`와 `LIMELINK_PROJECT_ID`는 무시됩니다. credential profile이 없으면 API 도구는 [Organizations](https://limelink.org/organizations)에서 Organization API key를 발급해 profile 파일에 설정하도록 안내합니다. Project 도구는 Project UUID를 직접 받을 수 있습니다. profile의 선택적 `projects` map은 반복 사용하는 Project를 위한 권장 편의 기능이지 필수 설정이 아닙니다. 필요하면 `list-projects`로 발견한 뒤 alias를 추가합니다. profile은 최초 API-backed 호출에서 credential introspection으로 지연 초기화됩니다. alias 추가를 포함한 profile 파일 변경은 MCP 서버 재시작 후 반영됩니다.

> API 키는 [LimeLink 대시보드](https://limelink.org/dashboard)에서 발급받을 수 있습니다. API 키 없이도 문서 리소스와 SDK 설정 가이드를 모두 사용할 수 있습니다.

## 도구 (Tools)

### `list-profiles`

API 호출 없이 설정된 alias, Organization 표시 이름, 기본 profile 여부와 현재 초기화 상태를 반환합니다. 이미 초기화된 profile에는 scopes가 포함됩니다. API key 원문은 secret으로 유지하며 절대 반환하지 않습니다. Organization, Project, Custom Domain, credential 식별자와 key prefix는 비-secret 식별자로서 필요한 API 도구 응답에 포함될 수 있습니다.

### `list-projects`

선택한 profile credential에서 확인한 Organization의 Project를 조회합니다. 선택적 `profile`을 받으며 credential에 `projects:read` scope가 필요합니다.

### `list-custom-domains`

필수 `project`(alias 또는 UUID)의 Custom Domain을 조회합니다. 선택적 `profile`을 받으며 `domains:read` scope가 필요합니다.

### `create-link`

플랫폼별 딥링크, Custom Domain, 소셜 미리보기와 UTM을 지원하는 V2 Core Link를 생성합니다.

**파라미터:**

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `dynamic_link_suffix` | string | N | 짧은 URL 경로 식별자 (1~100자); 생략 시 API 생성 |
| `dynamic_link_url` | string | Y | 대상 URL (최대 500자) |
| `dynamic_link_name` | string | Y | 링크 이름 (최대 100자) |
| `project` | string | Y | 선택 profile의 Project alias 또는 Project UUID |
| `profile` | string | N | profile alias; 생략하면 설정된 기본값 또는 유일한 profile 사용 |
| `custom_domain_id` | UUID string | N | Core Link에 사용할 Custom Domain |
| `stats_flag` | boolean | N | 분석 추적 활성화 |
| `apple_options` | object | N | iOS 딥링크 옵션 |
| `android_options` | object | N | Android 딥링크 옵션 |
| `additional_options` | object | N | 소셜 미리보기 + UTM 옵션 |

**Claude에서의 사용 예시:**

> "https://example.com/product/123 에 대한 다이나믹 링크를 suffix 'product-123'으로 만들어줘. 분석 추적도 활성화해줘"

### `get-link-by-suffix`

suffix로 다이나믹 링크를 조회합니다.

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `suffix` | string | Y | 다이나믹 링크 suffix |
| `project` | string | Y | 선택 profile의 Project alias 또는 Project UUID |
| `profile` | string | N | profile alias; 생략하면 설정된 기본값 또는 유일한 profile 사용 |

### `get-link-by-url`

전체 URL을 V2 API에 전달해 Link를 조회합니다. 백엔드가 Free 기본 namespace, Project hostname 또는 활성 Custom Domain인지 판별하므로 Project selector와 로컬 suffix 추출이 필요하지 않습니다.

URL은 absolute HTTPS이고 path가 정확히 `/{suffix}` 한 단계여야 하며 query, fragment, explicit port와 credentials를 포함할 수 없습니다.

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `url` | string | Y | 조회할 LimeLink 전체 URL (최대 2048자) |
| `profile` | string | N | profile alias; 생략하면 설정된 기본값 또는 유일한 profile 사용 |

## 리소스 (Resources)

### `limelink://docs/index`

LimeLink 전체 문서 인덱스(`llms.txt`)를 반환합니다.

### `limelink://docs/{slug}`

개별 문서 페이지를 반환합니다. 사용 가능한 slug:

`introduction`, `getting-started`, `project`, `application`, `dynamic-link`, `create-link`, `link-detail`, `link-management`, `appearance`, `sdk-integration`, `ios-sdk`, `android-sdk`, `api-integration`, `advanced`, `llm-agent`

**Claude에서의 사용 예시:**

> "LimeLink API 연동 문서를 읽어줘"
>
> Claude가 `limelink://docs/api-integration` 리소스에 접근합니다.

## 개발

### 사전 요구사항

- Node.js >= 18
- pnpm

### 설치

```bash
git clone https://github.com/hellovelop/limelink-mcp-server.git
cd limelink-mcp-server
pnpm install
pnpm run build
```

### 로컬 실행

```bash
LIMELINK_PROFILES_FILE=/absolute/path/to/limelink-profiles.json node dist/index.js
```

### 테스트

```bash
pnpm test          # 유닛 테스트
pnpm test:e2e      # E2E 테스트 (MCP stdio 통신)
pnpm test:watch    # 유닛 테스트 watch 모드
pnpm test:coverage # 커버리지 리포트
```

### 프로젝트 구조

```
src/
├── index.ts              # 진입점
├── lib/
│   ├── config.ts         # 환경변수 로딩
│   ├── cache.ts          # 인메모리 TTL 캐시
│   ├── api-client.ts     # LimeLink API HTTP 클라이언트
│   └── doc-fetcher.ts    # 문서 fetcher (캐싱 포함)
├── tools/
│   ├── create-link.ts    # create-link 도구
│   ├── get-link-by-suffix.ts
│   └── get-link-by-url.ts
└── resources/
    └── documentation.ts  # 문서 리소스
```

## 라이선스

MIT
