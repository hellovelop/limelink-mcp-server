# MCP 플랫폼 등록 체크리스트

## 사전 준비

- [ ] npm에 `@limelink/mcp@0.1.0` 공개 배포
- [x] GitHub 저장소 공개
- [x] 영문 `README.md` 작성
- [x] 한국어 `README.ko.md` 작성
- [x] `server.json`을 `@limelink/mcp@0.1.0` 기준으로 갱신
- [x] `glama.json` 추가
- [ ] Cline 등록용 400x400 PNG 로고 준비

## 플랫폼별 등록

- [ ] Official MCP Registry: `mcp-publisher` CLI
- [ ] Smithery.ai: `smithery mcp publish`
- [ ] Glama: 웹 UI 또는 `glama.json`
- [ ] mcp.so: GitHub Issue 제출
- [ ] Cline Marketplace: GitHub Issue 제출
- [ ] PulseMCP: 웹 폼 제출
- [ ] Awesome MCP Servers: 웹 폼 제출
- [ ] MCP-Get: 레지스트리 추가
- [ ] OpenTools: 웹 제출
- [ ] Anthropic Connectors: Remote MCP 전환 후 제출

## 권장 순서

1. npm 공개 배포를 완료합니다.
2. Official MCP Registry에서 `server.json`을 dry-run 검증한 뒤 게시합니다.
3. 자동 수집 여부를 확인합니다.
4. 자동 수집되지 않은 커뮤니티 플랫폼에 직접 제출합니다.
5. Cline용 로고를 준비하고 Marketplace에 제출합니다.
6. Remote MCP 지원이 추가된 뒤 Anthropic Connectors를 검토합니다.
