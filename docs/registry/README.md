# MCP 플랫폼 등록 가이드

> `@limelink/mcp`를 MCP 플랫폼과 레지스트리에 등록하기 위한 조사 및 실행 가이드입니다.

## 등록 전략

| 순위 | 플랫폼 | 유형 | 등록 난이도 | 비고 |
|:---:|---|---|:---:|---|
| 1 | Official MCP Registry | 공식 | 중 | 하위 플랫폼 자동 수집, 최우선 등록 |
| 2 | Smithery.ai | 커뮤니티 | 낮음 | CLI와 호스팅 지원 |
| 3 | Glama | 커뮤니티 | 낮음 | 웹 UI와 호스팅 지원 |
| 4 | mcp.so | 커뮤니티 | 낮음 | 대규모 카탈로그 |
| 5 | Cline Marketplace | 클라이언트 | 낮음 | VS Code 사용자 대상 |
| 6 | PulseMCP | 커뮤니티 | 낮음 | 매일 업데이트 |
| 7 | Awesome MCP Servers | 커뮤니티 | 낮음 | 큐레이션 목록 |
| 8 | MCP-Get | 커뮤니티 | 낮음 | npm 기반 패키지 매니저 |
| 9 | OpenTools | 커뮤니티 | 낮음 | 도구 특화 레지스트리 |
| 10 | Anthropic Connectors | 공식 | 높음 | Remote MCP 필요 |

Official MCP Registry에 먼저 등록하면 PulseMCP, Glama 등이 자동 수집할 수 있어 가장 효율적입니다.

## 세부 문서

- [핵심 플랫폼](./CORE_PLATFORMS.md): Official MCP Registry, Smithery, Glama, mcp.so
- [커뮤니티 및 추가 플랫폼](./COMMUNITY_PLATFORMS.md): Cline, PulseMCP, Awesome MCP Servers, MCP-Get, OpenTools, Anthropic Connectors
- [등록 체크리스트](./CHECKLIST.md): 공통 준비와 플랫폼별 진행 상태

*Last updated: 2026-08-21*
