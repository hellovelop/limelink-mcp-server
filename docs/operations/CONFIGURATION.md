# 설치 및 다중 프로필 설정

## 실행

Node.js 18 이상과 stdio MCP client를 지원합니다.

```bash
npx -y @limelink/mcp
```

## 프로필 파일

credential 설정 진입점은 `LIMELINK_PROFILES_FILE` 하나뿐입니다. `LIMELINK_API_KEY`와 `LIMELINK_PROJECT_ID`는 무시됩니다.

```json
{
  "version": 1,
  "defaultProfile": "work",
  "profiles": {
    "work": {
      "apiKey": "your_api_key",
      "organizationLabel": "Work",
      "projects": {
        "marketing": "11111111-1111-4111-8111-111111111111"
      }
    },
    "work-readonly": {
      "apiKey": "another_key",
      "organizationLabel": "Work read-only"
    }
  }
}
```

`version`은 `1`이어야 합니다. profile과 Project alias는 영숫자로 시작하는 최대 64자의 영숫자, `.`, `_`, `-` 조합입니다. 각 profile에는 `apiKey`, `organizationLabel`과 선택적인 `projects` map을 둡니다. Project map의 값은 UUID입니다.

Project UUID 직접 입력이 기본 사용법입니다. `projects` map은 반복 사용하는 Project를 위한 선택적 권장 편의 기능입니다. 먼저 `list-projects`로 UUID를 확인하고 필요한 Project만 alias로 추가할 수 있습니다. map이 없어도 모든 Project-backed 도구가 동작합니다.

profile 선택 순서는 호출의 `profile`, `defaultProfile`, 유일한 profile 순입니다. 여러 profile이 있고 selector와 default가 없으면 모호성 오류가 발생합니다. Project가 필요한 도구의 `project`는 선택 profile의 Project alias 또는 UUID이며 기본값은 없습니다.

profile은 선택된 API-backed 도구가 처음 사용할 때 credential introspection으로 초기화됩니다. `list-profiles`는 초기화를 유발하지 않습니다. 성공한 context는 process lifetime 동안 cache하고 실패는 다음 호출에서 재시도합니다. profile 파일 변경과 key rotation은 서버 재시작 후 반영됩니다.

파일이 없으면 문서 리소스와 로컬 `list-profiles`는 동작합니다. API 도구는 `https://limelink.org/organizations`에서 Organization API key를 발급하고 profile 파일에 추가한 뒤 `LIMELINK_PROFILES_FILE`을 설정해 서버를 재시작하라는 안내 오류를 반환합니다. 명시한 파일이 잘못되면 시작이 실패합니다. symlink는 허용하며 실제 regular-file 대상을 확인합니다. Unix에서 group/other-readable이면 secret-safe stderr 경고 후 계속합니다.

stdout은 MCP JSON-RPC 전용입니다. profile 파일과 API key 원문을 source control, prompt, log 또는 screenshot에 넣지 마세요. Organization, Project, Custom Domain, credential ID와 key prefix는 비-secret 식별자로 취급하며 API-backed 도구 응답에 포함될 수 있습니다.
