# 핵심 MCP 플랫폼

## 1. Official MCP Registry

- URL: https://registry.modelcontextprotocol.io
- GitHub: https://github.com/modelcontextprotocol/registry
- 유형: 공식

### 등록 방법

```bash
# 서버 메타데이터 생성
mcp-publisher init

# server.json 편집 후 GitHub 인증
mcp-publisher login github

# 검증 및 배포
mcp-publisher publish --dry-run
mcp-publisher publish
```

### 요구사항

- GitHub 인증으로 `io.github.{username}/*` 네임스페이스 접근
- 도메인 네임스페이스는 DNS TXT 또는 HTTP 인증 필요
- npm, PyPI, NuGet, Docker Hub, GHCR, MCPB 패키지 소스 지원
- MCP 모더레이션 가이드라인 준수

참고: https://modelcontextprotocol.info/tools/registry/publishing/

## 2. Smithery.ai

- URL: https://smithery.ai
- GitHub: https://github.com/smithery-ai
- 유형: 커뮤니티/상용

### 등록 방법

```bash
# Node.js 20 이상 필요
smithery mcp publish <url> -n <org/server>

# 연결 관리
smithery mcp add/list/remove
```

### 요구사항

- Node.js 20 이상
- GitHub 저장소
- 서버 메타데이터 및 설정

## 3. Glama

- URL: https://glama.ai/mcp/servers
- 유형: 커뮤니티/상용

### 등록 방법

1. 웹 UI에서 `Add Server`를 선택하고 Dockerfile을 설정해 배포합니다.
2. 또는 GitHub 저장소 루트의 `glama.json`으로 소유권을 주장합니다.

현재 프로젝트는 다음 최소 메타데이터 파일을 사용합니다.

```json
{
  "$schema": "https://glama.ai/mcp/schemas/server.json",
  "maintainers": ["dotdotgod"]
}
```

### 요구사항

- GitHub 저장소
- 호스팅 서버의 경우 Dockerfile

## 4. mcp.so

- URL: https://mcp.so
- 유형: 커뮤니티

### 등록 방법

1. mcp.so 상단의 `Submit` 버튼을 선택합니다.
2. 연결된 GitHub Issue에 서버명, 설명, 기능, 연결 정보를 제공합니다.

### 요구사항

- GitHub 저장소
- 이름, 설명, 기능 등 기본 메타데이터
