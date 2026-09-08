---
description: 시스템 구조 설계·재검토 — 처음이면 전체 설계, 이미 있으면 @architect 진단 후 필요한 부분만
argument-hint: [목표 단계 — poc / mvp / product. 생략 시 문서에서 읽거나 물어봄]
---

# /architecture — 시스템 구조 설계

당신(메인 AI)은 `system-architecture` 스킬을 따라 시스템 전체 구조를 정한다.

**언제 쓰나**:
- `/kickoff` 이 내부에서 호출 (프로젝트를 처음 열 때)
- 단계가 올라갈 때 (PoC → MVP, MVP → 제품화)
- 구조가 안 맞는 것 같을 때 정기 점검
- 큰 기능이 기존 구조로 안 될 때

**다른 커맨드와의 차이**:
- `/feature-plan`: 기능 하나의 설계. 이 커맨드는 시스템 전체
- `/decision`: 결정 한 건 기록. 이 커맨드는 결정을 만드는 과정

---

## 이 커맨드만의 규칙

> 말투, 승인 절차, 초안과 확정 구분 같은 공통 규칙은 `CLAUDE.md` 의 공통 작업 규칙을 따른다.

1. **사실은 묻고 판단은 제안한다.** 데이터 규모나 사내 규정은 사용자만 아니 묻는다. 무엇을 검증할지, 어떤 구조로 갈지는 자료를 읽고 안을 낸 뒤 확인받는다. "패키지 구조 어떻게 할까요" 라고 되묻지 않는다.
1a. **자료에 답이 있는 것은 묻지 않는다.** 기획 문서와 기존 코드에서 채울 수 있는 항목은 채운 뒤 확인만 받는다.
1b. **"모르겠다" 로 끝내지 않는다.** 사용자가 모르면 추정안을 근거와 함께 제시한다. "정하고 오세요" 로 되돌려 보내지 않는다.
2. **모든 제시에 "다시 볼 신호" 를 붙인다.** 이 줄이 없으면 나중에 `@architect` 가 검사할 근거가 없다.
3. **재실행이면 진단부터.** 문서가 이미 있는데 진단 없이 재설계에 들어가지 않는다.
4. **전부 다시 하지 않는다.** 진단에서 걸린 Step 만 밟는다.
5. **단계에 없는 항목은 묻지 않는다.** PoC 인터뷰가 길어지지 않게 스킬의 단계별 표를 따른다.

---

## Phase 0: 선행 체크

### 0-1. 호출 맥락 확인

이 커맨드는 두 가지 방식으로 실행된다.

| 방식 | 어떻게 아나 | 어디까지 수행하나 |
|---|---|---|
| **단독 실행** | 사용자가 `/architecture` 를 직접 입력 | Phase 0 부터 5 까지 전부 |
| **`/kickoff` 내부 호출** | `/kickoff` 이 Phase 3 에서 이 파일을 로드했다 | **Phase 3(문서 초안 생성)까지만.** Phase 4 검토와 Phase 5 확정은 건너뛴다 |

내부 호출일 때 검토와 확정을 하지 않는 이유는 `/kickoff` 이 자기 문서와 함께 한 번에 검토하고 확정하기 때문이다. 여기서 먼저 해버리면 검토가 두 번 돌고 파일을 두 번 옮기게 된다.

### 0-2. 환경 확인

1. 프로젝트 루트 확인.
2. `docs/plan.md` 존재 확인. 없으면 **"`/kickoff` 이 먼저 필요합니다"** 안내 후 중단. **내부 호출이면 이 검사를 건너뛴다.** `plan.md` 는 아직 만들어지기 전이다.
3. `docs/architecture.md` 존재 여부로 경로를 가른다.
   - **없음** → Phase 2 (첫 설계)
   - **있음** → Phase 1 (진단부터)
4. 목표 단계 확정. 인자로 받았으면 그것을 쓴다. 없으면 `docs/architecture.md` 나 `docs/milestones.md` 에서 읽는다. 둘 다 없으면(첫 설계) 기획 문서의 일정과 범위로 추정해 제시하고 확인받는다. 추정할 근거도 없으면 묻는다.
5. `.draft/architecture/` 생성.

---

## Phase 1: 현황 진단 — 재실행일 때만

### 1-1. @architect 호출

```
Agent(
  subagent_type: "architect",
  description: "현재 아키텍처 진단",
  prompt: `
docs/architecture.md, docs/data-model.md, CLAUDE.md, docs/context.md 와 실제 코드를
대조해 아키텍처 진단 리포트를 반환하라. 사용자와 대화하지 말고 리포트만 반환하라.

이번 진단의 맥락: <단계 전환 / 정기 점검 / 특정 문제 확인>
목표 단계: <Phase 0 에서 확정한 값>
`
)
```

### 1-2. 리포트 제시

에이전트 리포트를 **원본 그대로** 사용자에게 전달한 뒤 요약을 덧붙인다.

```
─────────────────────────────
🏛 아키텍처 진단 요약
- 🚨 지금 손봐야 함: N건
- ⚠️ 감수 가능: N건
- 🔔 재검토 신호: N건
- 전환 준비: <준비됨 / N건 남음>
─────────────────────────────
```

### 1-3. 무엇을 다시 밟을지 정한다

진단 결과를 근거로 어느 Step 이 필요한지 제안한다.

| 진단에서 나온 것 | 다시 밟을 Step |
|---|---|
| 데이터 구조가 요구와 안 맞음, 새 엔티티 필요 | Step 2 |
| 저장소나 배포가 단계에 안 맞음 | Step 3 |
| 배포 단위·통신 규격·횡단 관심사 변경 필요 | Step 4 |
| 코드 구조·예외 처리·테스트 전략 변경 필요 | Step 5 |
| 요구 자체가 바뀜 (사용자 종류 추가, 규모 급변) | Step 1 부터 |

**전부 다시 하자고 제안하지 않는다.** 걸린 것만 짚는다. 진단이 "문제 없음" 이면 그 사실을 보고하고 종료한다.

사용자가 범위를 확정하면 Phase 2 의 해당 Step 으로 간다.

---

## Phase 2: 설계

**Skill 도구로 `system-architecture` 스킬을 로드**하고 지시대로 수행한다.

첫 설계면 Step 1 부터 5 까지 순서대로. 재실행이면 Phase 1-3 에서 정해진 Step 만.

### 각 Step 을 마칠 때

1. 결과를 `.draft/architecture/step<N>-<YYYY-MM-DD>.md` 에 저장한다.
2. 사용자에게 요약해 확인받는다.
3. 뒤 Step 에서 앞이 틀렸다고 드러나면 앞으로 돌아간다. 되돌아간 사실을 사용자에게 알린다.

### 단계 전환일 때

Step 을 밟기 전에 스킬의 "단계가 올라갈 때" 목록을 펼쳐 **무엇이 필요한지 후보를 먼저 제시**한다. 사용자가 고르게 하고, 필요 없다고 판단한 것은 **왜 필요 없는지** 한 줄로 남긴다.

---

## Phase 3: 문서 초안 생성

Step 결과를 통합해 `.draft/architecture/final/` 에 만든다.

| 생성 파일 | 템플릿 | 내용 |
|---|---|---|
| `architecture.md` | `.claude/templates/architecture-template.md` | Step 4, 5 결과 + "다시 볼 신호" 목록 |
| `data-model.md` | `.claude/templates/data-model-template.md` | Step 2 결과 |
| `context-adr.md` | — | 각 Step 의 결정을 ADR 블록으로. `context.md` 에 append 할 조각 |
| `claude-rules.md` | — | 코드 규약 부분. `CLAUDE.md` 의 프로젝트 고유 규칙에 넣을 조각 |

**재실행이면 `architecture.md` 는 현재 상태로 전면 교체한다.** "원래는 A였으나" 같은 대조 문구를 남기지 않고 처음부터 그렇게 쓴 것처럼 다시 쓴다. 바뀐 이유는 ADR 이 갖는다.

ADR 태그는 `[architecture]` 를 기본으로 하고 내용에 따라 `[data]`, `[tech]`, `[infra]` 를 함께 붙인다. 단계 전환 중이면 `[milestone: <이름>]` 도 붙인다.

---

## Phase 4: @plan-reviewer 검토 — 단독 실행일 때만

> `/kickoff` 내부 호출이면 여기서 멈춘다. 초안을 `.draft/architecture/final/` 에 둔 채로 `/kickoff` Phase 4 로 돌아간다.

```
Agent(
  subagent_type: "plan-reviewer",
  description: "아키텍처 문서 배치 검토",
  prompt: `
다음 파일을 검토하고 Plan Review Report 를 반환하라.
사용자와 대화하지 말고 리포트만 반환하라.

- .draft/architecture/final/architecture.md
- .draft/architecture/final/data-model.md

참조 맥락:
- docs/plan.md (제품 방향과 일관되는가)
- docs/milestones.md (목표 단계와 맞는가)
- docs/context.md (기존 ADR 과 충돌하는가)

체크 포인트:
1. 현재 단계에 비해 과하게 설계하지 않았는가 (PoC 인데 제품화 수준)
2. 되돌리기 어려운 결정이 빠지지 않았는가 (식별자, 시각, API 규격, 트랜잭션 경계)
3. 각 결정에 "다시 볼 신호" 가 붙어 있는가
4. 지금 정하지 않은 것에 이유가 적혀 있는가
5. architecture.md 에 과거 이력이 남아 있지 않은가
6. data-model.md 의 엔티티가 plan.md 의 기능 범위를 감당하는가
`
)
```

---

## Phase 5: 확정 — 단독 실행일 때만

### 5-1. 컨펌 루프

리포트를 제시하고 승인을 받는다. 수정 요청이면 해당 부분을 고치고 Phase 4 를 다시 돌린다.

### 5-2. 반영

1. `.draft/architecture/final/architecture.md` → `docs/architecture.md`
2. `.draft/architecture/final/data-model.md` → `docs/data-model.md`
3. `context-adr.md` 내용을 `docs/context.md` 의 ADR 섹션 끝에 **append**
4. `claude-rules.md` 내용을 `CLAUDE.md` 의 프로젝트 고유 규칙 섹션에 반영
5. `.draft/` 중간 산출물은 지우지 않고 남긴다

### 5-3. 완료 요약

```
✅ 아키텍처 확정 (<단계>)

문서:
- docs/architecture.md
- docs/data-model.md
- docs/context.md 에 ADR N건 추가
- CLAUDE.md 프로젝트 고유 규칙 갱신

이번에 정한 것:
- <핵심 결정 3~5개 한 줄씩>

지금 정하지 않은 것:
- <미룬 것과 언제 다시 볼지>

다음 단계:
- 첫 기능 시작: /feature-start <기능명>
- 구조 점검: /architecture (다음 단계 전환 때)
```

---

## 실패 시나리오

| 상황 | 대응 |
|---|---|
| `docs/plan.md` 없음 | `/kickoff` 안내 후 중단 |
| `architecture.md` 는 있는데 코드가 없음 | 진단을 건너뛰고 문서만 검토. 그 사실을 명시 |
| `@architect` 가 빈 리포트 반환 | 맥락을 보강해 재호출 |
| 진단 결과 "문제 없음" | 보고 후 종료. 억지로 재설계하지 않는다 |
| 사용자가 목표 단계를 모름 | `milestones.md` 로 추정 후 확인 |
| 되돌아가기가 3회 넘게 반복 | 요구가 흔들리는 것이므로 Step 1 부터 다시 하자고 제안 |
