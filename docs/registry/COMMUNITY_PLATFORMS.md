# 커뮤니티 및 추가 MCP 플랫폼

## 5. Cline MCP Marketplace

- URL: https://github.com/cline/mcp-marketplace
- 유형: Cline VS Code 확장 전용

### 등록 방법

`cline/mcp-marketplace` 저장소에 Issue를 만들고 다음 정보를 제공합니다.

- GitHub 저장소 URL
- 400x400 PNG 로고
- README 설치 방법
- 선택 사항인 `llms-install.md`

심사에서는 커뮤니티 채택도, 개발자 신뢰도, 프로젝트 성숙도와 보안을 확인합니다.

## 6. PulseMCP

- URL: https://www.pulsemcp.com/servers
- 제출: https://www.pulsemcp.com/use-cases/submit
- 유형: 커뮤니티

웹 제출 폼을 작성합니다. Official MCP Registry 등록 결과가 자동 수집될 수도 있습니다.

## 7. Awesome MCP Servers

- URL: https://mcpservers.org
- 제출: https://mcpservers.org/submit
- GitHub: https://github.com/punkpeye/awesome-mcp-servers
- 유형: 커뮤니티 큐레이션 목록

GitHub PR이 아니라 웹사이트 제출 폼을 사용합니다.

## 8. MCP-Get

- URL: https://mcp-get.com
- npm: `@michaellatman/mcp-get`
- 유형: 커뮤니티 패키지 매니저

패키지를 레지스트리에 추가하면 mcp-get.com에 표시됩니다. 현재 패키지의 설치 대상은 `@limelink/mcp`입니다.

```bash
npx @michaellatman/mcp-get@latest install @limelink/mcp
```

## 9. OpenTools Registry

- URL: https://opentools.com/registry
- 유형: 커뮤니티

OpenTools 플랫폼의 제출 절차를 사용합니다.

## 10. Anthropic Connectors Directory

- URL: https://www.anthropic.com/partners/mcp
- 제출 가이드: https://support.claude.com/en/articles/12922490-remote-mcp-server-submission-guide
- 유형: 공식

### 등록 방법

1. HTTP 기반 Remote MCP 서버를 구축합니다. stdio 서버는 제출할 수 없습니다.
2. Anthropic MCP Directory 제출 프로세스를 진행합니다.
3. 더미 데이터가 포함된 테스트 계정을 제공합니다.
4. 핵심 기능을 보여주는 최소 3개 동작 예시를 제공합니다.
5. 개인정보 처리방침과 지원 연락처를 제공합니다.

### 요구사항

- Remote MCP 서버
- OAuth 또는 다른 인증 흐름
- Anthropic MCP Directory 정책 및 약관 준수

현재 `@limelink/mcp`는 stdio 기반이므로 Remote MCP로 전환한 뒤 등록할 수 있습니다.
