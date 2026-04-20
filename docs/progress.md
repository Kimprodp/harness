# Progress Log

> harness 프로젝트의 Step별 진행 로그 + 주요 결정 기록.
> 신규 세션 진입 또는 대화 압축 후 현재 상태 복구용.

**Last Updated**: 2026-04-19

---

## 📊 현재 상태

**Phase 3 구현 완료**. 하니스 기본 기능 세트 + 자동화 (Playwright / 보안 주기 상기 / 설치 스크립트) 완성.

### 핵심 산출물 (전체 누적)
- **에이전트 3개**: `@plan-reviewer`, `@reviewer`, `@security`
- **스킬 6개**: `idea-validation`, `product-spec`, `scope-review`, `tech-stack-decision`, `tech-spec`, `design-slop-patterns`
- **커맨드 12개**: `/kickoff`, `/feature-start`, `/feature-plan`, `/task`, `/code-review`, `/project-status`, `/update-docs`, `/investigate`, `/qa`, `/design-review`, `/security-audit`, `/ship`
- **Hook 2개 + 스캐폴딩**: `freshness.js` (Stop), `auto-skill.js` (UserPromptSubmit), `post-edit.example.js` (PostToolUse, 빈 슬롯)
- **스크립트 9개**: `_shared` 3종, `qa/runner.js`, `design-review` 3종 (capture/dom-check/mockup-gen), `ship` 2종 (bump-version/changelog-gen)
- **설치 스크립트**: `install.sh`, `install.ps1` (cross-platform)
- **템플릿 6개**: 하이브리드 구조 (plan/context/tasks + feature prd/tech-spec)

### 남은 작업 (백로그)
- [ ] **Step 7**: `README.md` (GitHub용) + `docs/story.md` (포트폴리오용)
- [ ] 실전 하니스 설치 + Dry Run 검증 (실제 새 프로젝트에서)

---

## 🗓 Step별 완료 이력

### Phase 1 (MVP 구축)

| Step | 내용 | 날짜 |
|---|---|---|
| 1 | `.gitignore` Node 템플릿 + OS/IDE/Claude 설정 추가 | 2026-04-17 |
| 2 | 3문서 템플릿 (plan, context, tasks) + CLAUDE.md 템플릿 | 2026-04-17 |
| 2.5 | 템플릿 업그레이드 (Last Updated, AC, Effort, Risk+Mitigation, Impl Snapshot) + 하이브리드 구조 (features/) | 2026-04-17 |
| 3 | 에이전트 2개: `@plan-reviewer`, `@reviewer` | 2026-04-17 |
| 3.5 | 말투 통일 + `@reviewer` 재작성 (OWASP 축소 + Tech Proposal) + `@security` 신규 | 2026-04-17 |
| 4 | 스킬 5개: `idea-validation`, `product-spec`, `scope-review`, `tech-stack-decision`, `tech-spec` (gstack 포팅 포함) | 2026-04-17 |
| 4.5 | 스킬 리네이밍 (office-hours → idea-validation 등) + 소크라테스 표현 제거 + `scope-review` Long-Term Trajectory 보강 | 2026-04-17 |
| 5 | 핵심 커맨드 3개: `/kickoff`, `/feature-start`, `/feature-plan` | 2026-04-17 |
| 5.5 | `design.md` → `tech-spec.md` 파일명 변경 + ADR 태그 시스템 (`[feature: X]` 등) + 전체 참조 업데이트 | 2026-04-17 |
| 6 | 보조 커맨드 3개: `/code-review`, `/project-status`, `/update-docs` | 2026-04-18 |
| 6.5 | `/task` 신규 (맥락 자동 로드 + 기능 완료 감지) + 연속성 프롬프트 추가 (feature-start → feature-plan → task → code-review → update-docs) + @에이전트 사용자 출력 메시지 정리 | 2026-04-18 |
| 6.6 | 1차 Dry Run 이슈 반영 (`templates/` → `.claude/templates/` 이동, Phase 5-3 오기재 수정, 연속성 호출 메커니즘 명시, git log 문법, AC 검증 구체화) | 2026-04-18 |
| 6.7 | 2차 Dry Run 이슈 반영 (완료된 기능 아카이브 구조, task 체크오프 로직 재설계, Phase 하드코딩 제거, git init 제안, 문서 신선도 기준) | 2026-04-18 |

### Phase 1 남은 작업

- [ ] **Step 7**: `README.md` (GitHub용 간결) + `docs/story.md` (포트폴리오용) + (선택) 미니 mock 테스트
- [ ] **Step 7-0 (이 문서 생성)**: Compact 방어 — `CLAUDE.md`, `docs/progress.md`, 메모리 인덱스 ← **지금 진행 중**

### Phase 2 (진행 중 — 축소판)

| Step | 내용 | 날짜 |
|---|---|---|
| 2-1 | `/investigate` 커맨드 — 디버깅 조사 (Phase 0 선행 체크 → 증상 수집 → 가설 3개+반증 → 검증 → Root Cause 리포트 + tasks.md 추가 제안). 조사 전용 (코드 수정 X). | 2026-04-19 |
| 2-2 | Hook 구조 스캐폴딩 — `.claude/settings.json` (Stop/PostToolUse/UserPromptSubmit 슬롯), `.claude/hooks/README.md` (이벤트 설명 + 런타임 요구), `.claude/hooks/post-edit.example.js` (린터 훅 예시, 주석 처리 기본값) | 2026-04-19 |
| 2-3 | `.claude/hooks/freshness.js` — Stop 이벤트에서 transcript 파싱 → 이번 세션 Edit/Write 대상이 `docs/**.md` 또는 `CLAUDE.md` 면 `Last Updated` 오늘 날짜로 자동 치환. `settings.json` 에 등록. | 2026-04-19 |

### Phase 3 (실행 자동화 + 릴리스 파이프라인)

| Step | 내용 | 날짜 |
|---|---|---|
| 3-0 | 공용 기반 — `.claude/package.json` (playwright ^1.45) + `.claude/state/` (gitignored 런타임 상태) + `.claude/scripts/_shared/` (ensure-playwright / check-dev-server / version-check) + `.gitignore` 업데이트 | 2026-04-20 |
| 3-1 | `/security-audit` — `@security` 독립 래퍼. 범위별 감사 (인증/결제/외부API). 완료 후 `state/security-audit.json` 에 이력 자동 기록 | 2026-04-20 |
| 3-2 | `/qa` — Playwright 3-tier 브라우저 검증 (Quick/Standard/Exhaustive) + `runner.js` (JSON 시나리오 실행, 스크린샷/콘솔/네트워크 로그 수집) | 2026-04-20 |
| 3-3 | `/design-review` — `design-slop-patterns` 스킬 (10대 AI Slop) + `capture.js` (다중 viewport) + `dom-check.js` (rule 기반 자동 감지) + `mockup-gen.js` (타겟 목업 생성) + Dual scoring (Design Grade + AI Slop Score) | 2026-04-20 |
| 3-4 | `/ship` — 릴리스 파이프라인 (base merge → 품질 게이트 → plan 감사 → 버전 bump → CHANGELOG → 승인 후 커밋/푸시/PR) + `bump-version.js` (VERSION / package.json / pubspec.yaml 지원) + `changelog-gen.js` (커밋 기반) | 2026-04-20 |
| 3-5 | `auto-skill` Hook (UserPromptSubmit) + `skill-rules.json` (10개 키워드 규칙) + `settings.json` `reminders` 섹션. 보안 감사 주기 체크 통합 (30일 기본). `task.md` 5-3-a 민감 영역 감지 + `project-status.md` 🔒 보안 감사 섹션 추가 | 2026-04-20 |
| 3-6 | `install.sh` + `install.ps1` — cross-platform 설치 스크립트 (기존 .claude 백업 → 복사 → .gitignore 업데이트 → npm install → Playwright 선택 설치) | 2026-04-20 |
| 3-7 | 이 문서 + `CLAUDE.md` Phase 3 완료 반영 | 2026-04-20 |

### Phase 4 (먼 미래)

- 생활 자동화 (Gmail / Calendar 연동 — Karpathy 스타일 LLM 위키)
- Mac Mini 상주 + Telegram Bot 연동
- README / story 공개용 작성 (Step 7 잔여)

---

## 🎛 결정 로그

### [structure] 하이브리드 문서 구조
- 프로덕트 3문서 (plan/context/tasks) + 기능별 2파일 (prd/tech-spec)
- 원문(diet103)은 기능마다 3문서 세트 → 파일 과다로 하이브리드 채택
- 기능 단위 결정은 기능 파일 대신 **프로덕트 context.md에 태그로 통합**

### [structure] ADR 태그 시스템
- `[product]`, `[feature: <name>]`, `[tech]`, `[infra]`, `[security]`, `[data]`
- 모든 ADR은 `docs/context.md` 한 곳에 통합
- 분산 우려(어디 있는지 못 찾음) 해결

### [structure] 커맨드 vs 에이전트 역할
- **커맨드**: 사용자 진입점 (슬래시 명령어)
- **에이전트**: 격리된 배치 실행 (`@plan-reviewer`, `@reviewer`, `@security`) — 사용자 대화 불가
- 인터랙티브 인터뷰는 **메인 AI가 직접 수행** (에이전트 X)
- 이유: Claude Code 서브에이전트는 원샷 배치 작업만 가능

### [structure] `/task` 단위
- `/task` 1회 호출 = tasks.md의 **todo 1개** 작업
- 기능 완성 = 여러 /task 반복 호출
- 기능 단위 아님 명확화

### [structure] 기능 단위 아카이브
- 개별 todo 완료 시: 원래 위치에 `[x]` (이동 X, 맥락 유지)
- 기능 하위 모든 todo 완료 감지 시: AI 제안 → 사용자 승인 → "완료된 기능" 섹션으로 통째 이동
- tasks-template.md의 "완료된 작업" → **"완료된 기능"** 으로 변경

### [tech] 파일명 일관성
- `design.md` → `tech-spec.md` (스킬 이름 `tech-spec` 과 일치)
- `design`은 UI 디자인 혼동 우려. `spec`이 product-spec과 대칭.

### [tech] 스킬 이름
- `office-hours` → `idea-validation` (외래 개념 회피)
- `product-definition` → `product-spec`
- `ceo-review` → `scope-review` (실제 내용인 "범위 조정"과 일치 + 원문과의 혼동 방지 — 원문 11섹션은 제외)
- `tech-foundation` → `tech-stack-decision`
- `tech-design` → `tech-spec`

### [tech] 연속성 자동 호출 메커니즘
- 사용자 "네/Y/진행" 응답 시: AI가 해당 커맨드 파일(`.claude/commands/<next>.md`)을 **Read 도구로 로드 후 지시대로 수행**
- 슬래시 입력 없이 연속 실행
- 동작 이상 시 사용자가 직접 `/<커맨드>` 입력 폴백

### [structure] 템플릿 위치
- `.claude/templates/` 로 이동 (원래 루트 `templates/` 였음)
- 설치 시 `.claude/` 한 폴더 복사하면 전부 포함

### [product] `/kickoff` 5 Phase 인터뷰
- Phase 1 idea-validation (가치/수요 검증) → Phase 2 product-spec (솔루션) → Phase 3 scope-review (범위) → Phase 4 tech-stack-decision (기술) → Phase 5 문서 생성 + plan-reviewer 검토
- `.draft/` 중간 저장으로 중단/재개 가능

### [product] Dry Run 2회 이슈 반영 완료
- 1차: `templates/` 경로, Skill tool 오기재, 연속성 메커니즘 명시, git log 문법, AC 검증
- 2차: 완료된 기능 아카이브 구조, Phase 하드코딩 제거, git init 제안, 문서 신선도 기준

### [feedback] 에이전트 사용자 출력 메시지
- `@security` 같은 에이전트 이름을 사용자 출력 메시지 안에 노출하지 않음 (사용자가 직접 호출하는 것으로 오인)
- 대신 자연어 ("보안도 봐줘", "`/code-review 보안까지`") 로 안내

### [feedback] 소크라테스 표현 제거
- idea-validation 스킬에서 "소크라테스식" 표현 모두 제거
- 원본 gstack에도 없는 장식 표현이라 과함
- "허점 발굴 인터뷰" 로 대체

### [feedback] 말투 규칙
- 에이전트 프론트매터 description: "~합니다" → "~한다" 변경
- 본문의 단정형/명령형(~다., ~금지, ~ X)은 그대로 유지 (일괄 변환 금지)

---

## 📁 주요 파일 변경 이력

| 변경 | 원본 | 최종 |
|---|---|---|
| 폴더 이동 | `templates/` | `.claude/templates/` |
| 파일명 | `templates/feature-design-template.md` | `.claude/templates/feature-tech-spec-template.md` |
| 파일명 (스킬) | `skills/office-hours/` | `skills/idea-validation/` |
| 파일명 (스킬) | `skills/product-definition/` | `skills/product-spec/` |
| 파일명 (스킬) | `skills/ceo-review/` | `skills/scope-review/` |
| 파일명 (스킬) | `skills/tech-foundation/` | `skills/tech-stack-decision/` |
| 파일명 (스킬) | `skills/tech-design/` | `skills/tech-spec/` |
| 파일명 (커맨드) | `commands/review.md` | `commands/code-review.md` (내장 충돌 회피) |
| 파일명 (커맨드) | `commands/status.md` (미생성) | `commands/project-status.md` (내장 충돌 회피) |

---

## 🚧 중단/재개 참조

### 세션 재진입 시 해야 할 일
1. `CLAUDE.md` 읽기 (프로젝트 전체 맥락)
2. 이 파일(`docs/progress.md`) 읽기 (상세 진행 상태)
3. 사용자에게 "어디서부터 이어갈까요?" 확인
4. 필요 시 `.claude/` 하위 관련 파일 참조

### 주의
- **대화 압축 후에는 이 문서와 CLAUDE.md가 유일한 진짜 맥락**
- 세부 기억이 불확실하면 반드시 이 두 문서 재확인 후 작업
