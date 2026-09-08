# harness

Claude Code 기반 개인 개발 하네스. 프로젝트에 `.claude/` 를 설치하면 기획, 설계, 구현, 검증, 릴리스가 정해진 절차로 진행된다.

- 아이디어 단계의 개인 프로젝트와 기획이 완료된 제품 개발을 모두 지원한다
- 시스템 설계와 기능 정의와 구현과 검증을 커맨드로 표준화한다
- 문서와 코드가 벌어지지 않도록 전용 에이전트가 대조 검증한다
- 되돌리기 어려운 결정을 먼저 확정하고 나머지는 확장 지점만 열어 둔다

---

## 요구 사항

| 항목 | 비고 |
|---|---|
| Claude Code | 필수 |
| git | 필수 |
| Node.js 18+ | `/qa`, `/design-review`, `/perf`, `/cleanup` 에서 사용. 없어도 나머지 커맨드는 동작 |

---

## 설치

대상 프로젝트 루트에서 실행한다.

```bash
bash <harness-path>/install.sh [--force] [--skip-playwright]
```

Windows:

```powershell
powershell -ExecutionPolicy Bypass -File <harness-path>\install.ps1 [-Force] [-SkipPlaywright]
```

설치 스크립트가 수행하는 작업.

1. 기존 `.claude/` 가 있으면 `.claude.backup-<timestamp>/` 로 백업
2. `.claude/` 복사
3. `.gitignore` 에 런타임 경로 추가
4. `.claude/` 에서 `npm install`
5. Playwright 브라우저 설치 (선택)

`.gitignore` 에 추가되는 항목.

```
.claude/node_modules/
.claude/state/*
!.claude/state/.gitkeep
.claude/scripts/*/reports/
.claude/scripts/*/snapshots/
.claude/scripts/*/mockups/
.claude/settings.local.json
```

### 업데이트

설치는 복사 방식이므로 하네스 원본을 수정해도 기존 프로젝트에 자동 반영되지 않는다. 반영하려면 해당 프로젝트에서 설치를 다시 실행한다.

```bash
bash <harness-path>/install.sh --force
```

프로젝트별로 수정한 훅이나 QA 시나리오가 있으면 백업 디렉토리에서 옮긴다.

---

## 시작하기

설치 후 프로젝트에서 Claude Code 를 실행하고 `/kickoff` 를 호출한다.

```
/kickoff
```

프로젝트 성격에 따라 두 경로로 갈린다.

| 입력 | 진행 |
|---|---|
| 새로 시작하는 아이디어 | 아이디어 검증 → 제품 정의 → 범위 조정 → 시스템 설계 |
| 기획이 이미 있음 | 기존 기획 문서 인수 → 시스템 설계 |

두 경로 모두 `/architecture` 를 내부 호출해 시스템 설계를 마친 뒤 `docs/` 문서 세트를 생성한다.

---

## 사용 방법

### 1. 프로젝트 초기 설정

`/kickoff` 가 제품 정의부터 시스템 설계까지 한 번에 진행한다. 시스템 설계는 다음 순서로 수행된다.

```
요구 수집 → 데이터 모델 → 기술 선택 → 시스템 구조 → 코드 구조
```

요구를 먼저 수집하고 그다음에 기술을 고른다. 데이터의 형태가 확정되기 전에 저장소를 선택하지 않는다.

각 결정은 권장안과 근거, 얻는 것과 잃는 것, 대안, **재검토 조건**을 함께 제시한 뒤 확인을 받는다. 재검토 조건은 이후 `@architect` 가 검사하는 기준이 된다.

산출물은 `docs/plan.md`, `docs/architecture.md`, `docs/data-model.md`, `docs/context.md`, `docs/tasks.md`, `docs/milestones.md`, 그리고 `CLAUDE.md` 다.

### 2. 기능 개발

```
/feature-start <기능명>    기능 정의. 범위와 규모를 먼저 확인
/feature-plan  <기능명>    기술 설계, 작업 분해, 브랜치 생성
/task                      작업 항목 진입. 관련 문서 자동 로드
      [ 구현 ]
/done                      완료 조건 검증, 체크오프, 커밋
      [ /task ~ /done 반복 ]
/code-review               변경 리뷰
/qa                        동작 검증
/ship                      CI 확인, 버전, CHANGELOG, PR
```

`/feature-start` 는 시작 시점에 두 가지를 확인한다.

- **범위** — 백엔드만인지, 프론트만인지, 양쪽인지. 생성할 문서와 검증 방법이 달라진다
- **규모** — 문서가 필요한 크기인지. 작은 작업은 `docs/tasks.md` 항목 하나로 처리한다

### 3. 단계 전환과 구조 점검

제품 단계가 올라가거나 시스템 구조에 의문이 생기면 `/architecture` 를 호출한다.

```
/architecture [poc|mvp|product]
```

문서가 이미 존재하면 설계 전에 `@architect` 진단을 먼저 실행한다. 진단 항목은 다음과 같다.

- 문서에 기술된 구조와 실제 코드의 불일치
- 초기에 기록한 재검토 조건의 발생 여부
- 목표 단계로 전환할 때의 준비 상태

진단 결과에 따라 필요한 단계만 다시 수행한다. 전체를 재설계하지 않는다.

### 4. 문서 유지

| 시점 | 커맨드 |
|---|---|
| 기술 결정 직후 | `/decision` — ADR 1건 즉시 기록 |
| 세션 종료 시 | `/update-docs` — 스냅샷과 ADR 과 작업 상태 일괄 갱신 |
| 마일스톤 완료 시 | `/compile-spec` — 전체 기능 명세, 화면 목록, README 재생성 |

---

## 커맨드

| 상황 | 커맨드 |
|---|---|
| 프로젝트 초기 설정 | `/kickoff` |
| 시스템 구조 설계 및 재검토 | `/architecture` |
| 기능 정의 | `/feature-start` |
| 기술 설계와 작업 분해 | `/feature-plan` |
| 구현 작업 진입 | `/task` |
| 작업 완료 처리 | `/done` |
| 코드 리뷰 | `/code-review` |
| 버그 원인 분석 | `/investigate` |
| 동작 검증 (브라우저 / API) | `/qa` |
| 시각 품질 감사 | `/design-review` |
| 성능 측정 | `/perf` |
| 보안 감사 | `/security-audit` |
| 기술 결정 기록 | `/decision` |
| 문서 일괄 갱신 | `/update-docs` |
| 명세 취합과 README 생성 | `/compile-spec` |
| 진행 상황 확인 | `/project-status` |
| 기술 부채 점검 | `/cleanup` |
| 릴리스 | `/ship` |

각 커맨드는 완료 시 다음 단계를 제안한다. 프롬프트에서 관련 상황이 감지되면 훅이 해당 커맨드를 안내한다.

### 구분이 필요한 커맨드

| 비교 | 차이 |
|---|---|
| `/feature-plan` · `/architecture` | 기능 단위 설계 · 시스템 전체 구조 |
| `/decision` · `/update-docs` | 결정 1건 즉시 기록 · 세션 종료 시 일괄 갱신 |
| `/investigate` · `/code-review` | 원인 분석 · 품질 검토 |
| `/qa` · `/perf` · `/design-review` | 동작 · 응답 속도 · 시각 품질 |

---

## 산출 문서

```
프로젝트 루트/
├── README.md                    제품 개요와 실행 방법 (생성)
├── CLAUDE.md                    프로젝트 규칙과 코드 컨벤션
└── docs/
    ├── plan.md                  제품 방향
    ├── milestones.md            마일스톤과 완료 기준
    ├── architecture.md          시스템 구조 (현재 상태)
    ├── data-model.md            엔티티, 관계, 저장 위치
    ├── context.md               결정 기록 (ADR) 과 구현 스냅샷
    ├── tasks.md                 작업 인덱스
    ├── spec-index.md            전체 기능 명세 (생성)
    ├── screens-index.md         전체 화면 목록 (생성)
    └── features/<기능명>/
        ├── prd.md               기능 배경과 목표
        ├── functional-spec.md   동작 규칙
        ├── screens.md           화면 구성 (화면이 있는 경우)
        └── tech-spec.md         기술 설계
```

기능 디렉토리의 구성은 범위와 규모에 따라 달라진다. 백엔드 전용 기능에는 `screens.md` 를 생성하지 않으며, 소규모 작업은 디렉토리를 생성하지 않는다.

`architecture.md` 는 현재 상태만 유지한다. 변경 이력과 사유는 `context.md` 의 ADR 이 보관한다.

문서별 역할과 경계는 [docs/spec.md](docs/spec.md) 에 정의되어 있다.

---

## 구성

| 층 | 역할 |
|---|---|
| 커맨드 | 사용자 진입점. 메인 세션이 대화하며 수행 |
| 에이전트 | 배치 실행. 리포트만 반환하며 사용자와 대화하지 않음 |
| 스킬 | 인터뷰와 판정 기준. 커맨드가 로드해 사용 |
| 훅 | 프롬프트 분석, 커맨드 힌트 주입, 주기 알림 |
| 템플릿 | 문서 생성 시 사용하는 골격 |
| 스크립트 | Playwright 검증, 버전 관리, CHANGELOG 생성 |

### 에이전트

| 에이전트 | 검토 대상 |
|---|---|
| `@plan-reviewer` | 기획·설계 문서 |
| `@architect` | 문서와 코드의 정합성, 아키텍처 적합성 |
| `@reviewer` | 코드 변경 |
| `@security` | OWASP 기준 취약점 |

`@plan-reviewer` 는 문서를, `@reviewer` 는 변경된 코드를 검토한다. `@architect` 는 두 대상을 대조한다.

### 디렉토리

```
.claude/
├── agents/          에이전트 정의
├── commands/        커맨드 정의
├── skills/          스킬 정의
├── templates/       문서 템플릿
├── hooks/           훅 스크립트
├── scripts/         실행 스크립트
├── state/           런타임 상태 (gitignore)
├── settings.json    훅 등록과 주기 설정
└── skill-rules.json 힌트 주입 규칙
```

---

## 설정

### `.claude/settings.json`

| 키 | 기본값 | 설명 |
|---|---|---|
| `reminders.security_audit_interval_days` | `30` | 보안 감사 권장 주기. 초과 시 경고 |
| `reminders.cleanup_interval_days` | `45` | 기술 부채 점검 권장 주기 |
| `reminders.security_sensitive_keywords` | 인증·결제 관련어 | 민감 영역 감지 키워드 |

### `.claude/skill-rules.json`

프롬프트에 특정 키워드가 포함되면 관련 커맨드 힌트를 주입한다. 프로젝트에 맞게 키워드와 힌트를 조정한다.

### 훅

`post-edit` 슬롯에 프로젝트 린터나 포매터를 연결할 수 있다.

```bash
cp .claude/hooks/post-edit.example.js .claude/hooks/post-edit.js
```

파일을 편집한 뒤 `.claude/settings.json` 의 `PostToolUse` 에 등록한다.

---

## 문제 해결

**Windows PowerShell 에서 `install.ps1` 파싱 오류**

Windows PowerShell 5.1 은 BOM 이 없는 UTF-8 파일을 시스템 코드페이지로 해석한다. 저장소의 `install.ps1` 은 BOM 을 포함하므로 정상 동작하지만, 직접 편집한 경우 UTF-8 with BOM 으로 저장해야 한다. PowerShell 7(`pwsh`) 은 BOM 없이도 동작한다.

**Playwright 미설치**

`/qa` 와 `/design-review` 첫 실행 시 자동 설치된다. 수동 설치는 다음과 같다.

```bash
cd .claude && npx playwright install chromium
```

**커맨드가 인식되지 않음**

`.claude/commands/` 가 프로젝트 루트에 위치하는지 확인한다. 하위 디렉토리에서 Claude Code 를 실행하면 커맨드를 찾지 못한다.

---

## 문서

| 문서 | 내용 |
|---|---|
| [docs/spec.md](docs/spec.md) | 하네스 구조의 정본. 프로세스, 문서 경계, 각 요소의 역할, 설계 원칙 |
| [CLAUDE.md](CLAUDE.md) | 하네스 자체를 개발할 때의 프로젝트 맥락 |

---

## 참고

- [gstack](https://github.com/garrytan/gstack) (MIT) — `idea-validation`, `scope-review`, `tech-stack-decision` 의 원형
- [diet103/claude-code-infrastructure-showcase](https://github.com/diet103/claude-code-infrastructure-showcase) (MIT) — 문서 시스템과 훅 구조

## 라이선스

MIT
