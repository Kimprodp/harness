---
description: 동작 검증 — 브라우저 모드와 API 모드. 시나리오를 만들어 실행하고 결과를 리포트
argument-hint: [자연어 시나리오 설명 — 예: "로그인 플로우" / --api, --quick, --exhaustive, --headed]
---

# /qa — 동작 검증

당신(메인 AI)은 기능이 실제로 동작하는지 검증한다. 시나리오 JSON 을 만들고, 승인을 받고, 실행하고, 결과를 제시한다.

**두 모드가 있다.**

| 모드 | 대상 | 도구 |
|---|---|---|
| 브라우저 | 화면이 있는 기능 | Playwright |
| API | 백엔드만 있는 기능 | Node 내장 fetch. Playwright 불필요 |

**다른 커맨드와의 차이**: `/code-review` 는 코드를 읽고, `/investigate` 는 원인을 찾고, `/qa` 는 **실제로 실행해서** 동작을 확인한다.

---

## 이 커맨드만의 규칙

> 말투, 승인 절차 같은 공통 규칙은 `CLAUDE.md` 의 공통 작업 규칙을 따른다.

1. **승인 없이 실행하지 않는다.** 시나리오를 보여주고 확인받은 뒤에 돌린다.
2. **코드를 수정하지 않는다.** 실패하면 `/investigate` 로 넘긴다.
3. **시나리오를 저장한다.** 일회성 실행도 남긴다. 회귀 검증의 기반이 된다.
4. **실패를 뭉뚱그리지 않는다.** 통과처럼 보이게 쓰지 않는다.
5. **경고를 무시하지 않는다.** 스텝이 통과해도 콘솔 오류나 느린 응답이 있으면 요약에 적는다.

---

## Phase 0: 선행 체크

1. `.claude/scripts/qa/runner.js` 와 `api-runner.js` 존재 확인.
2. 모드 결정.
   - 인자에 `--api` 가 있으면 API 모드
   - 기능의 `docs/features/<X>/` 에 `screens.md` 가 없으면 API 모드로 추정
   - 그 외 브라우저 모드
   - 추정 결과를 사용자에게 한 줄로 확인한다
3. 서버 주소 결정. 인자에 있으면 쓰고, 없으면 브라우저는 `http://localhost:3000`, API 는 `http://localhost:8080` 을 기본으로 제시하고 확인받는다.
4. 브라우저 모드에서 Playwright 가 없으면 설치 동의를 받는다. 약 320MB 를 내려받는다. **API 모드는 설치가 필요 없다.**

---

## Phase 1: 시나리오 수집

### 1-1. 모드별 세부 설정

**브라우저 모드**

| 인자 | 범위 |
|---|---|
| `--quick` | 30초 스모크. 홈과 주요 경로 이동, 콘솔 오류 감지 |
| (기본) | 핵심 플로우 하나에서 둘. 콘솔과 네트워크 확인 |
| `--exhaustive` | 모든 플로우, 상호작용 상태, 반응형 |

**API 모드**는 검증할 엔드포인트 묶음으로 범위를 정한다.

### 1-2. 필요한 정보

- 무엇을 확인하려는가
- 시작 지점 (경로 또는 엔드포인트)
- 전제 조건 (로그인 필요 여부, 시드 데이터)
- 무엇이 되면 통과인가

`docs/features/<X>/functional-spec.md` 가 있으면 먼저 읽는다. 동작 규칙과 예외 상황이 거기 있으므로 시나리오를 사용자에게 묻지 않고 초안을 만들 수 있다. **특히 경계값과 예외 상황 표를 시나리오로 옮긴다.** 정상 경로만 검증하면 의미가 절반이다.

---

## Phase 2: 시나리오 작성

### 2-1. API 모드

`.claude/scripts/qa/scenarios/<이름>.json` 에 저장한다.

```json
{
  "name": "auth-flow",
  "type": "api",
  "baseUrl": "http://localhost:8080",
  "headers": { "Content-Type": "application/json" },
  "vars": { "email": "test@example.com" },
  "steps": [
    {
      "action": "request",
      "name": "로그인",
      "method": "POST",
      "path": "/api/login",
      "body": { "email": "{{email}}", "password": "pw1234" },
      "expect": { "status": 200, "jsonHas": ["token"] },
      "capture": { "token": "$.token" }
    },
    {
      "action": "request",
      "name": "토큰으로 내 정보 조회",
      "method": "GET",
      "path": "/api/me",
      "headers": { "Authorization": "Bearer {{token}}" },
      "expect": { "status": 200, "jsonEquals": { "email": "{{email}}" }, "maxMs": 1000 }
    },
    {
      "action": "request",
      "name": "토큰 없이 접근하면 거부",
      "method": "GET",
      "path": "/api/me",
      "expect": { "status": 401 }
    }
  ]
}
```

**`type: "api"` 가 필수다.** 이 값이 있으면 브라우저를 띄우지 않는다.

**action**

| action | 필드 |
|---|---|
| `request` | `method`, `path` 또는 `url`, `headers`, `body`, `expect`, `capture`, `timeout`, `name` |
| `wait` | `ms` |

**expect**

| 키 | 검증 |
|---|---|
| `status` | 응답 코드. 숫자 또는 배열 |
| `statusLt` | 이 값보다 작아야 함 |
| `contains` / `notContains` | 본문 문자열 포함 여부 |
| `jsonHas` | JSON 경로가 존재해야 함. `["token", "user.id"]` |
| `jsonEquals` | 경로별 기대값. `{"user.email": "a@b.c"}` |
| `maxMs` | 응답 시간 상한 |

**capture** 로 응답값을 변수에 담아 다음 스텝에서 `{{변수명}}` 으로 쓴다. 경로와 헤더와 본문과 기대값 모두에서 치환된다.

**검증할 것을 정상 경로에만 두지 않는다.** 권한 없이 접근, 잘못된 입력, 존재하지 않는 자원, 중복 요청. `functional-spec.md` 의 예외 처리 표가 그대로 시나리오가 된다.

### 2-2. 브라우저 모드

```json
{
  "name": "login-flow",
  "mode": "standard",
  "url": "http://localhost:3000",
  "viewport": { "width": 1280, "height": 800 },
  "steps": [
    { "action": "goto", "path": "/login" },
    { "action": "fill", "selector": "#email", "value": "test@example.com" },
    { "action": "fill", "selector": "#password", "value": "password123" },
    { "action": "click", "selector": "button[type=submit]" },
    { "action": "waitForURL", "pattern": "**/dashboard", "timeout": 5000 },
    { "action": "expect", "selector": "h1", "contains": "Dashboard" }
  ]
}
```

| action | 필드 |
|---|---|
| `goto` | `path` 또는 `url`, `waitUntil`, `timeout` |
| `click` | `selector`, `timeout` |
| `fill` | `selector`, `value`, `timeout` |
| `press` | `key` |
| `waitForSelector` | `selector`, `timeout` |
| `waitForURL` | `pattern`, `timeout` |
| `wait` | `ms` |
| `expect` | `selector` + `contains`, 또는 `urlContains` |

`screens.md` 의 상태별 표시(로딩, 데이터 없음, 오류, 권한 없음)를 시나리오에 넣는다. 여기가 실제로 자주 깨진다.

### 2-3. 승인

```
아래 시나리오로 진행합니다.

  모드: API
  대상: http://localhost:8080

  1. POST /api/login          → 200, token 반환
  2. GET  /api/me (토큰)      → 200, email 일치, 1초 이내
  3. GET  /api/me (토큰 없음) → 401

  저장: .claude/scripts/qa/scenarios/auth-flow.json

진행할까요? (수정할 곳이 있으면 알려주세요)
```

---

## Phase 3: 실행

```bash
node .claude/scripts/qa/runner.js --scenario .claude/scripts/qa/scenarios/<이름>.json
```

`runner.js` 가 시나리오의 `type` 을 보고 API 면 `api-runner.js` 로 넘긴다. 브라우저 모드는 `--headed` 로 창을 띄울 수 있다.

**종료 코드**

| 코드 | 의미 |
|---|---|
| 0 | 전체 통과 |
| 1 | 스텝 실패 |
| 2 | 잘못된 인자 |
| 3 | 서버 응답 없음 |
| 4 | 내부 오류 |

---

## Phase 4: 결과 제시

stdout 의 JSON 을 파싱해 보기 좋게 정리한다.

```
📊 QA 리포트 — auth-flow (API)

  ✅ 1. 로그인                    POST /api/login   200   21ms
  ✅ 2. 토큰으로 내 정보 조회      GET  /api/me      200    8ms
  🔴 3. 토큰 없이 접근하면 거부    GET  /api/me      200    7ms
     └ status 200 (기대 401)

─────────────────────────────
판정: 🔴 실패 (3/3 스텝 중 1개)
- 통과 2 / 실패 1
- 최대 응답 21ms
─────────────────────────────
```

브라우저 모드면 콘솔 오류, 네트워크 실패, 스크린샷 경로를 함께 보여준다.

실패한 스텝의 응답 본문을 함께 제시한다. 원인 파악에 필요하다.

---

## Phase 5: 후속

### 실패했을 때

```
원인을 조사할까요?

• "/investigate"        → 체계적 원인 분석
• "시나리오 수정"        → Phase 2 로 돌아가 고치고 재실행
• "tasks.md 에 버그 추가" → 기록만
• "넘어가"              → 종료
```

### 통과했을 때

```
✅ 전체 통과.

• "/done"           → 작업 완료 처리
• "예외 경로도 추가"  → 시나리오 보강 후 재실행
• "다른 시나리오"     → Phase 1 로
```

| 사용자 요청 | 행동 |
|---|---|
| `/investigate` | 실패한 스텝과 응답을 증상으로 전달하며 전환 |
| tasks.md 에 버그 추가 | 해당 기능 섹션에 `#### 버그 수정` 항목 추가 |
| 재실행 | 시나리오 경로를 기억해 두었다가 바로 다시 실행 |
| 시나리오 수정 | 기존 JSON 을 읽고 변경점을 논의한 뒤 덮어쓰고 재승인 |
| 성능이 걱정됨 | `/perf` 로 전환. `/qa` 는 한 번씩만 호출하므로 부하 측정이 아니다 |

---

## 실패 시나리오

| 상황 | 대응 |
|---|---|
| 서버 응답 없음 (코드 3) | 서버를 먼저 켜달라고 안내 후 중단 |
| Playwright 설치 거부 | 브라우저 모드 중단. API 모드는 그대로 가능하다고 안내 |
| 선택자가 틀림 (첫 스텝부터 실패) | 올바른 선택자를 묻거나 페이지 구조를 읽어 확인 |
| capture 실패 | 응답 본문을 보여주고 경로를 함께 수정 |
| 간헐 실패 | 한 번 재실행. 반복되면 `/investigate` 권장 |
| 내부 오류 (코드 4) | stderr 스택 확인. Node 버전이나 시나리오 형식 문제 |
| 요구가 모호함 | 한 번 재질문하고 그래도 모호하면 가정을 명시한 채 진행 |
