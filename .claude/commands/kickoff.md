---
description: 프로젝트 킥오프 — 새 아이디어와 기존 기획 두 경로. 제품 정의부터 시스템 설계까지
---

# /kickoff — 프로젝트 킥오프

당신(메인 AI)은 프로젝트를 처음 여는 작업을 진행한다. 제품이 무엇인지 정하고, 시스템을 설계하고, `docs/` 문서 세트를 만든다.

**두 경로를 받는다.**

| 입력 | 진행 |
|---|---|
| 새로 시작하는 아이디어 | 아이디어 검증 → 제품 정의 → 범위 조정 |
| 기획이 이미 있음 | 기존 기획 문서를 읽고 확인 |

두 경로가 Phase 3 에서 합류해 시스템 설계로 이어진다.

---

## 이 커맨드만의 규칙

> 말투, 승인 절차, 초안과 확정 구분 같은 공통 규칙은 `CLAUDE.md` 의 공통 작업 규칙을 따른다.

1. **경로를 먼저 가른다.** 아이디어 검증 인터뷰를 기획이 끝난 프로젝트에 돌리지 않는다. 이미 내려진 결론과 다른 답이 나오면 문서가 서로 어긋난다.
2. **시스템 설계는 `/architecture` 에 맡긴다.** 이 커맨드가 직접 기술을 고르지 않는다.
3. **각 Phase 완료 직후 `.draft/` 에 저장한다.** 중간에 끊겨도 이어받는다.

---

## Phase 0: 선행 체크

### 0-1. 환경 확인

- 프로젝트 루트인지 확인. 아니면 중단하고 사유 보고.
- `.git` 존재 확인. 없으면 **"Git 저장소가 초기화되지 않았습니다. `git init` 을 실행할까요?"** 물어본다. 거절하면 `/ship`, `/project-status` 등이 제한된다고 알리고 진행.
- 쓰기 권한 확인.

### 0-2. 기존 상태 감지

`docs/plan.md` 가 있으면 이미 킥오프된 프로젝트다. 사용자에게 확인한다.

- 덮어쓰기 — 기존 `docs/` 를 `docs.backup-<timestamp>/` 로 백업
- 취소
- 일부 Phase 만 재실행 — 어느 Phase 인지 확인

`.draft/kickoff-progress.md` 가 있으면 읽고 마지막 완료 Phase 부터 이어갈지 물어본다.

### 0-3. 경로 분기

사용자에게 묻는다.

```
프로젝트를 어떻게 시작하시나요?

  A. 새로 시작하는 아이디어
     → 아이디어 검증부터 진행합니다. 30분 정도 걸립니다.

  B. 기획이 이미 있음
     → 기존 문서를 읽고 확인만 합니다. 문서 경로를 알려주세요.
       (별도 문서가 없으면 내용을 붙여넣으셔도 됩니다)
```

A 면 Phase 1, B 면 Phase 2 로 간다.

### 0-4. 작업 공간 준비

`.draft/` 생성 후 `kickoff-progress.md` 초기화.

```markdown
# Kickoff Progress

- **Started**: YYYY-MM-DD HH:MM
- **경로**: A (새 아이디어) / B (기존 기획)

## Phases
- [ ] Phase 1 — 아이디어 검증 (경로 A 만)
- [ ] Phase 2 — 제품 정의
- [ ] Phase 3 — 시스템 설계
- [ ] Phase 4 — 문서 생성과 확정

## Artifacts
- (비어 있음)
```

각 Phase 시작 시 `⏳`, 완료 시 `[x] ✅ <timestamp>` 로 갱신하고 생성된 draft 경로를 Artifacts 에 추가한다.

---

## Phase 1: 아이디어 검증 — 경로 A 만

### 1-1. 허점 발굴 인터뷰

**Skill 도구로 `idea-validation` 스킬 로드.** 6가지 질문을 순차 진행하고 모호한 답변은 두 번 파고든다. "이번 주 실행 과제" 를 도출한다.

`.draft/idea-validation-<YYYY-MM-DD>.md` 저장.

### 1-2. 솔루션 구체화

**Skill 도구로 `product-spec` 스킬 로드.** 7개 섹션을 진행한다.

`.draft/product-spec-<YYYY-MM-DD>.md` 저장.

### 1-3. 범위 조정

**Skill 도구로 `scope-review` 스킬 로드.** 모드를 사용자에게 고르게 하고(확장 / 선택적 확장 / 유지 / 축소) 그 모드로 일관되게 수행한다. Long-Term Trajectory 섹션은 모드와 무관하게 필수다.

`.draft/scope-review-<YYYY-MM-DD>.md` 저장.

Phase 3 으로 간다.

---

## Phase 2: 기존 기획 인수 — 경로 B 만

### 2-1. 문서 수집

사용자에게 받은 경로의 문서를 Read 로 읽는다. 여러 개면 전부 읽는다. 붙여넣기로 받았으면 `.draft/given-plan-<YYYY-MM-DD>.md` 에 원문 그대로 저장한다.

### 2-2. 읽은 내용 정리

다음 항목을 문서에서 뽑아 정리한다. **문서에 없는 것을 지어내지 않는다.** 없으면 "문서에 없음" 으로 표시한다.

| 항목 | 뽑을 것 |
|---|---|
| 무엇을 만드는가 | 제품 정의 한 문장 |
| 왜 만드는가 | 해결하려는 문제 |
| 누구를 위한 것인가 | 대상 사용자 |
| 무엇을 만들고 무엇을 안 만드는가 | 범위 |
| 성공을 무엇으로 판단하는가 | 지표 |
| 이미 정해진 것 | 기술, 제약, 결정 사항 |
| 언제까지 | 일정과 마일스톤 |

### 2-3. 빠진 것 확인

"문서에 없음" 으로 표시된 항목을 사용자에게 묻는다. 한 번에 나열해서 묻고, 답하지 않은 것은 "미정" 으로 남긴다.

**기술과 시스템 구조는 여기서 묻지 않는다.** 기획 문서에 기술 얘기가 없는 것은 정상이다. 언어와 저장소와 배포 방식은 Phase 3 이 요구를 모은 뒤 근거를 갖고 정한다. 여기서 먼저 물으면 같은 것을 두 번 묻게 되고, 근거 없이 고른 답이 Phase 3 의 판단을 묶는다.

기획 문서에 **이미 정해진** 기술 제약이 있으면(사내 표준 스택, 반드시 써야 하는 시스템) 그것만 기록해 Phase 3 에 전달한다.

**기획 내용 자체를 다시 검증하지 않는다.** 이미 결론이 난 것이라 여기서 뒤집으면 원본 기획과 어긋난다. 다만 명백한 모순(범위와 일정이 맞지 않는 등)이 보이면 지적만 하고 판단은 사용자에게 맡긴다.

### 2-4. 정리 결과 확인

정리한 내용을 사용자에게 보여주고 맞는지 확인받는다.

`.draft/adopted-plan-<YYYY-MM-DD>.md` 저장.

---

## Phase 3: 시스템 설계 — 두 경로 합류

`.claude/commands/architecture.md` 를 Read 로 로드하고 그 지시대로 수행한다. **내부 호출이므로 Phase 3(문서 초안 생성)까지만 수행하고 Phase 4 검토와 Phase 5 확정은 건너뛴다.** 검토와 확정은 아래 Phase 4 가 자기 문서와 함께 한 번에 처리한다.

첫 설계이므로 진단 단계도 건너뛰고 Step 1 부터 시작한다.

앞 Phase 의 draft 를 맥락으로 전달한다. Step 1 요구 수집에서 이미 답이 나온 항목은 다시 묻지 않고 확인만 받는다. 경로 B 라면 기획 문서에서 이미 뽑은 대상 사용자, 범위, 일정이 여기 해당한다.

산출물은 `.draft/architecture/final/` 에 쌓인다.

---

## Phase 4: 문서 생성과 확정

### 4-1. 초안 생성

앞 Phase 산출물을 통합해 `.draft/final/` 에 만든다.

| 파일 | 템플릿 | 내용 소스 |
|---|---|---|
| `plan.md` | `plan-template.md` | 경로 A 는 Phase 1 산출물, 경로 B 는 Phase 2 정리 결과 |
| `milestones.md` | `milestones-template.md` | 로드맵과 일정. 없으면 첫 마일스톤 하나만 |
| `context.md` | `context-template.md` | 전제, 제약, 리스크 + Phase 3 의 ADR |
| `tasks.md` | `tasks-template.md` | 첫 마일스톤의 작업. 경로 A 면 "이번 주 실행" 을 최상단에 |
| `CLAUDE.md` | `CLAUDE.md.template` | 프로젝트 개요, 기술 스택, 코드 규약 |

`architecture.md` 와 `data-model.md` 는 Phase 3 에서 이미 만들어져 있다.

### 4-2. CI 설정 확인

프로젝트에 CI 설정이 있는지 확인한다.

- `.github/workflows/*.yml`
- `.gitlab-ci.yml`
- `Jenkinsfile`
- `.circleci/config.yml`

없으면 물어본다.

```
CI 설정이 없습니다. 만들까요?

테스트를 자동으로 돌리면 /ship 이 로컬에서 다시 돌리지 않고
CI 결과를 확인하는 방식으로 동작합니다.

  - 만든다 → 어느 서비스를 쓰는지 알려주세요 (GitHub Actions / GitLab CI / 기타)
  - 나중에 → /ship 이 로컬에서 테스트를 돌립니다
```

만든다고 하면 Phase 3 에서 정한 언어와 테스트 도구에 맞춰 최소 워크플로를 생성한다. 테스트 실행과 린트까지만 넣고 배포는 넣지 않는다.

### 4-3. @plan-reviewer 검토

```
Agent(
  subagent_type: "plan-reviewer",
  description: "프로젝트 킥오프 문서 배치 검토",
  prompt: `
다음 파일을 Product Kickoff 문서 종류로 검토하고 Plan Review Report 를 반환하라.
사용자와 대화하지 말고 리포트만 반환하라.

- .draft/final/plan.md
- .draft/final/milestones.md
- .draft/final/context.md
- .draft/final/tasks.md
- .draft/final/CLAUDE.md
- .draft/architecture/final/architecture.md
- .draft/architecture/final/data-model.md

체크리스트:
1. 각 문서 개별 검토 (스킬 지침의 체크리스트 준수)
2. 교차 검증 — 마일스톤과 tasks 의 정합성, plan 의 기술 스택과 architecture 의 일관성,
   data-model 의 엔티티가 plan 의 기능 범위를 감당하는가
3. 현재 단계에 비해 과하게 설계하지 않았는가
4. 발견사항을 🚨/⚠️/💡/✅ 우선순위로 정리
5. 종합 평가 (통과 / 조건부 통과 / 재작성 권장)
`
)
```

### 4-4. 컨펌 루프

리포트를 그대로 제시하고 승인을 받는다. 수정 요청이면 해당 부분을 고치고 다시 검토한다. 승인할 때까지 반복한다.

### 4-5. 확정

1. `.draft/final/plan.md`, `milestones.md`, `context.md`, `tasks.md` → `docs/`
2. `.draft/final/CLAUDE.md` → 프로젝트 루트
3. `.draft/architecture/final/architecture.md`, `data-model.md` → `docs/`
4. `.draft/architecture/final/context-adr.md` 의 내용을 `docs/context.md` 의 ADR 절 끝에 **붙여 넣는다.** 파일째 옮기지 않는다
5. `.draft/architecture/final/claude-rules.md` 의 내용을 `CLAUDE.md` 의 프로젝트 고유 규칙 절에 **반영한다.** 파일째 옮기지 않는다
6. `kickoff-progress.md` 에 완료 스탬프
7. `.draft/` 중간 산출물은 지우지 않고 남긴다

4번과 5번은 조각이다. `docs/` 에 그대로 두면 어디에도 속하지 않는 파일이 남는다.

```
✅ Kickoff 완료

생성된 문서:
- docs/plan.md            제품 방향
- docs/milestones.md      마일스톤
- docs/architecture.md    시스템 구조
- docs/data-model.md      데이터 모델
- docs/context.md         결정 기록 (ADR N건)
- docs/tasks.md           작업 인덱스
- CLAUDE.md               프로젝트 규칙

이번에 정한 것:
- <핵심 결정 3~5개 한 줄씩>

지금 정하지 않은 것:
- <미룬 것과 언제 다시 볼지>

다음 단계:
- 첫 기능 시작: /feature-start <기능명>
- 구조 재검토: /architecture (단계가 올라갈 때)
```

---

## 중단과 재시작

중단하거나 세션이 끊기면 현재까지의 산출물을 `.draft/` 에 저장하고 `kickoff-progress.md` 에 마지막 상태를 기록한다. 재실행하면 그 지점부터 이어간다.

---

## 실패 시나리오

| 상황 | 대응 |
|---|---|
| 경로 B 인데 문서를 찾을 수 없음 | 경로 재확인. 없으면 내용 붙여넣기 요청 |
| 경로 B 문서에 내용이 너무 적음 | 뽑을 수 있는 것만 정리하고 나머지는 Phase 2-3 에서 질문 |
| 경로 B 문서끼리 서로 모순 | 모순 지점을 제시하고 어느 쪽이 맞는지 확인 |
| Phase 답변이 모호함 | 두 번 파고들고 그래도 모호하면 "불명확" 플래그를 달고 진행 |
| 도중에 방향이 크게 바뀜 | 해당 Phase 부터 재실행 제안 (이 커맨드의 Phase 를 말한다) |
| 템플릿 경로를 못 찾음 | `.claude/templates/` 확인. 없으면 중단하고 설치 확인 요청 |
