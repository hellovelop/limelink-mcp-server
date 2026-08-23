# 운영 가이드

`@limelink/mcp`의 설치, 실행, 환경변수와 외부 네트워크 동작을 설명합니다.

## 문서

- [설치 및 설정](./CONFIGURATION.md): package/binary, Node.js, stdio, 환경변수와 client 설정
- [네트워크 동작](./NETWORK_BEHAVIOR.md): LimeLink API·문서 endpoint, 인증, 캐시, 실패와 현재 복원력 제한

## 빠른 구분

- npm/npx package: `@limelink/mcp`
- global executable: `limelink-mcp`
- transport: stdio only
- Node.js: 18 이상

MCP 입력·출력 계약은 [기능 참조](../capabilities/README.md), 내부 구성은 [아키텍처](../architecture/README.md)를 참고합니다.
