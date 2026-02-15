# limelink-mcp-server

[![npm version](https://img.shields.io/npm/v/limelink-mcp-server.svg)](https://www.npmjs.com/package/limelink-mcp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[English](./README.md)

[LimeLink](https://limelink.org) 다이나믹 링크 관리를 위한 [Model Context Protocol (MCP)](https://modelcontextprotocol.io) 서버입니다. Claude Code, Claude Desktop 등 MCP 호환 클라이언트에서 다이나믹 링크를 직접 생성하고 조회할 수 있습니다.

## 기능

- **3개 도구** — 다이나믹 링크 생성, suffix로 조회, URL로 조회
- **문서 리소스** — LimeLink 문서 15페이지 + 인덱스를 AI 어시스턴트에서 직접 접근
- **2개 프롬프트 템플릿** — 링크 생성 및 SDK 딥링크 설정 가이드 워크플로우
- **인메모리 캐싱** — 문서 fetch에 1시간 TTL 캐시 적용

## 빠른 시작

### npx로 사용 (권장)

설치 없이 바로 사용할 수 있습니다. Claude Code 또는 Claude Desktop 설정에 추가하세요:

```json
{
  "mcpServers": {
    "limelink": {
      "command": "npx",
      "args": ["-y", "limelink-mcp-server"],
      "env": {
        "LIMELINK_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

### 글로벌 설치로 사용

```bash
npm install -g limelink-mcp-server
```

```json
{
  "mcpServers": {
    "limelink": {
      "command": "limelink-mcp-server",
      "env": {
        "LIMELINK_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

## 설정

### 설정 파일 위치

| 클라이언트 | 설정 파일 |
|-----------|----------|
| Claude Code (글로벌) | `~/.claude/settings.json` |
| Claude Code (프로젝트) | `.claude/settings.local.json` |
| Claude Desktop (macOS) | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Claude Desktop (Windows) | `%APPDATA%\Claude\claude_desktop_config.json` |

### 환경변수

| 변수 | 필수 | 기본값 | 설명 |
|------|------|--------|------|
| `LIMELINK_API_KEY` | N | — | 프로젝트 인증용 API 키 (API 도구 사용 시 필수, 문서 리소스는 키 없이 이용 가능) |
| `LIMELINK_PROJECT_ID` | N | — | 기본 프로젝트 ID (도구 호출 시 미지정 시 사용) |

> API 키는 [LimeLink 대시보드](https://limelink.org/dashboard)에서 발급받을 수 있습니다. API 키 없이도 문서 리소스는 사용할 수 있습니다.

## 도구 (Tools)

### `create-link`

플랫폼별 딥링크, 소셜 미리보기, UTM 추적 기능을 포함한 다이나믹 링크를 생성합니다.

**파라미터:**

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `dynamic_link_suffix` | string | Y | 짧은 URL 경로 식별자 (최대 50자) |
| `dynamic_link_url` | string | Y | 대상 URL (최대 500자) |
| `dynamic_link_name` | string | Y | 링크 이름 (최대 100자) |
| `project_id` | string | N | 프로젝트 ID (환경변수 대체 가능) |
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
| `project_id` | string | N | 프로젝트 ID (환경변수 대체 가능) |

### `get-link-by-url`

전체 URL로 다이나믹 링크를 조회합니다. 두 가지 URL 포맷에서 자동으로 suffix를 추출합니다:

- **Free 플랜:** `https://deep.limelink.org/{suffix}`
- **Pro 플랜:** `https://{project}.limelink.org/link/{suffix}`

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `url` | string | Y | LimeLink 다이나믹 링크 전체 URL |
| `project_id` | string | N | 프로젝트 ID (환경변수 대체 가능) |

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

## 프롬프트 (Prompts)

### `create-dynamic-link`

다이나믹 링크 생성을 위한 가이드 워크플로우입니다.

| 인자 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `target_url` | string | Y | 대상 URL |
| `suffix` | string | N | 커스텀 suffix |
| `platforms` | enum | Y | `ios`, `android`, `both`, `web` |

### `setup-deep-linking`

LimeLink SDK 딥링크 설정을 위한 가이드 워크플로우입니다.

| 인자 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `platform` | enum | Y | `ios`, `android`, `both` |

## 개발

### 사전 요구사항

- Node.js >= 18
- pnpm

### 설치

```bash
git clone https://github.com/dotdot/limelink-mcp-server.git
cd limelink-mcp-server
pnpm install
pnpm run build
```

### 로컬 실행

```bash
LIMELINK_API_KEY=your_key node dist/index.js
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
├── resources/
│   └── documentation.ts  # 문서 리소스
└── prompts/
    ├── create-link-prompt.ts
    └── deep-link-prompt.ts
```

## 라이선스

MIT
