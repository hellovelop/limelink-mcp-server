# 공개 기능 개요

`@limelink/mcp`는 stdio로 실행되는 LimeLink MCP 서버입니다. 공개 기능은 도구 6종과 문서 리소스 2종이며 MCP 프롬프트는 등록하지 않습니다.

## 도구 6종

| 이름 | 목적 | 선택된 profile credential |
|---|---|:---:|
| `list-profiles` | 로컬 profile과 초기화 상태 조회 | 불필요 |
| `list-projects` | 선택 profile Organization의 Project 조회 | 필요 |
| `list-custom-domains` | 선택 Project의 Custom Domain 조회 | 필요 |
| `create-link` | 공식 V2 Core Link 생성 | 필요 |
| `get-link-by-suffix` | suffix로 다이나믹 링크 조회 | 필요 |
| `get-link-by-url` | V2 backend resolver로 Free/Project/Custom Domain URL 조회 | 필요 |

상세 계약은 [TOOLS.md](./TOOLS.md)를 참고합니다.

## 문서 리소스 2종

| URI | 유형 | 원격 출처 | 선택된 profile credential |
|---|---|---|:---:|
| `limelink://docs/index` | 정적 리소스 | `https://limelink.org/llms.txt` | 불필요 |
| `limelink://docs/{slug}` | 리소스 템플릿 | `https://limelink.org/md/{slug}.md` | 불필요 |

상세 계약은 [RESOURCES.md](./RESOURCES.md)를 참고합니다.

## 설정

- `LIMELINK_PROFILES_FILE`: 도구의 LimeLink API 인증에 사용합니다.
- profile별 optional `projects`: Project alias에서 UUID로의 로컬 map입니다.
- Project가 필요한 호출의 `project`: 선택 profile의 alias 또는 Project UUID입니다.

문서 조회와 `list-profiles`는 credential 초기화 없이 사용할 수 있습니다. 설치와 실행은 [운영 가이드](../operations/README.md), 내부 등록 흐름은 [아키텍처](../architecture/README.md)를 참고합니다.
