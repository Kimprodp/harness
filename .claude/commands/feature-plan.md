---
description: 기능 기술 설계 (tech-spec.md 작성) — tech-spec 스킬 + @plan-reviewer 검토 + tasks.md Task 분해
argument-hint: <기능명>
---

# /feature-plan — 기능 기술 설계

당신(메인 AI)은 PRD가 작성된 기능의 **기술 설계 문서**(tech-spec.md)를 만든다.
`tech-spec` 스킬을 따라 4개 섹션을 순차 수행하고, `@plan-reviewer`에게 검토 후 사용자 컨펌을 받아 `docs/features/<기능명>/tech-spec.md`로 확정한다.
마지막으로 `docs/tasks.md`에 구현 Task를 분해하여 추가한다.

**인자**: 기능명 (PRD가 이미 있어야 함)

---

## 이 커맨드만의 규칙

> 말투, 승인 절차, 초안과 확정 구분 같은 공통 규칙은 `CLAUDE.md` 의 공통 작업 규칙을 따른다.

1. **섹션은 순차로, 앞 섹션의 이슈를 해결한 뒤 다음으로.** 병렬로 진행하지 않는다.
2. **섹션 내 이슈는 하나씩 확인한다.** 여러 질문을 한 번에 묶어 던지지 않는다.
3. **회귀 테스트는 기본 포함.** 확인 없이 자동으로 넣는다.
4. **PRD 범위를 벗어나지 않는다.** 벗어나면 PRD 를 고칠지 확인한다.
5. **아키텍처에 영향이 있으면 여기서 정하지 않는다.** `/architecture` 를 먼저 돌리라고 안내한다.

---

## Phase 0: 선행 체크 + 맥락 로드

### 0-1. 맥락 로드

- Read: `docs/features/<기능명>/prd.md` (필수. 없으면 `/feature-start <기능명>` 안내 후 중단)
- Read: `docs/features/<기능명>/functional-spec.md` (필수. 동작 규칙이 설계의 입력이다)
- Read: `docs/features/<기능명>/screens.md` (있으면)
- Read: `docs/plan.md`, `docs/architecture.md`, `docs/data-model.md`, `docs/context.md`, `CLAUDE.md`
- PRD 와 기능 명세를 요약해 한두 문장으로 설계 시작을 알린다.

`docs/plan.md` 나 `docs/architecture.md` 가 없으면 `/kickoff` 안내 후 중단한다.

### 0-2. 기존 design 체크

- `docs/features/<기능명>/tech-spec.md` 존재?
  → 사용자에게: **"design이 이미 있다. 어떻게 할까?"**
    - A. 덮어쓰기 (기존은 `design.backup-<timestamp>.md`로)
    - B. 취소
- `.draft/features/<기능명>/feature-plan-progress.md` 존재? → 이어서 진행 여부 확인.

### 0-3. 작업 공간 준비

- `.draft/features/<기능명>/` 보장.
- Progress 파일 초기화:

```markdown
# Feature Plan Progress — <기능명>
- **Started**: YYYY-MM-DD HH:MM
- [ ] Step 0 — Scope Challenge
- [ ] Section 1 — Architecture
- [ ] Section 2 — Code Quality
- [ ] Section 3 — Tests (Coverage Diagram)
- [ ] Section 4 — Performance
- [ ] Outside Voice (선택)
- [ ] Design 생성
- [ ] 검토 + 확정
- [ ] tasks.md 분해 추가
```

---

## Phase 1: tech-spec 스킬 수행

### 1-0. Skill 로드
**Skill tool로 `tech-spec` 스킬 로드**.

### 1-1. Step 0 — Scope Challenge (필수)

- 복잡도 체크 (파일 8+ 또는 새 클래스/서비스 2+ 이면 축소 제안).
- 기존 코드 재활용 가능성 감사.
- 복잡도 초과 시 사용자에게 **A. 진행 / B. 축소 / C. 단계적 도입** 선택지 제시.

### 1-2. Section 1 — Architecture Review

평가 항목은 tech-spec 스킬 지침 참조. 필수 산출물:
- 비자명 플로우 ASCII 다이어그램
- 새 코드 경로당 **실제 프로덕션 실패 1개** 식별 + 처리 여부

**섹션 끝**: 발견 이슈를 **개별적으로** 사용자 확인 (일괄 질문 금지). 모두 해결 후 Section 2.

### 1-3. Section 2 — Code Quality Review

- DRY 공격적 플래그.
- 오래된 ASCII 다이어그램 업데이트 확인.
- 섹션 끝 개별 확인.

### 1-4. Section 3 — Test Review (가장 깊음)

**Coverage Diagram 필수 생성**:
- 3-1 실행 추적 (분기/에러 경로 전부 ASCII로)
- 3-2 사용자 플로우 & 인터랙션 엣지 케이스
- 3-3 커버리지 점수 (★★★/★★/★)
- 3-4 갭 식별 (unit/integration/E2E/eval)
- 3-5 테스트 계획 산출

**회귀(regression) 테스트는 기본 포함**. AskUserQuestion 없이 자동 추가.

### 1-5. Section 4 — Performance Review

N+1 / 메모리 / 캐싱 / 느린 경로 / 인덱스 / 예상 트래픽.

### 1-6. Outside Voice (선택)

섹션 4까지 통과 후 사용자에게 제시:
```
추천: A (독립 2차 의견은 구조적 맹점을 잡는다).
A. Outside Voice 받기 (Codex 또는 Claude 서브에이전트로 독립 챌린지)
B. 건너뛰기
```

A 선택 시:
- 가능하면 독립 모델로 동일 PRD + 초안 design을 챌린지.
- 결과를 원본 그대로 제시.
- Cross-model tension이 있으면 **개별 AskUserQuestion**으로 해결.
- Outside Voice 의견 **자동 반영 금지**.

---

## Phase 2: tech-spec.md 초안 생성

### 실행
1. Phase 1에서 수집된 모든 정보 통합.
2. `.claude/templates/feature-tech-spec-template.md` 로드하여 빈칸 채움.
3. tech-spec 스킬 고유 섹션 추가:
   - Scope Challenge 결과
   - Coverage Diagram (ASCII)
   - Failure Modes Registry (표)
   - Parallelization Strategy (표)
   - Outside Voice 결과 (했을 경우)
   - Completion Summary (섹션별 발견 건수)
4. `.draft/features/<기능명>/tech-spec-draft.md` 에 저장.

### 필수 산출물 섹션 (design 초안에 모두 포함)

1. **NOT in scope** — 명시 제외 + 근거
2. **What already exists** — 재활용 / 불필요 재구현 코드
3. **Test coverage diagram** — ASCII
4. **Failure modes** — 새 경로당 실패 + 처리/테스트/가시성
5. **Parallelization strategy** — 의존성 테이블 + 레인 + 실행 순서
6. **Completion summary**

---

## Phase 3: @plan-reviewer 검토

Agent tool 호출:

```
Agent(
  subagent_type: "plan-reviewer",
  description: "기능 기술 설계 배치 검토",
  prompt: `
다음 파일을 Feature Design 문서 종류로 검토하고 Plan Review Report를 반환하라.
사용자와 대화하지 말고 리포트만 반환하라.

- .draft/features/<기능명>/tech-spec-draft.md

참조 맥락:
- docs/features/<기능명>/prd.md (범위 일관성 확인용)
- docs/plan.md §6 (기술 스택 일관성)
- docs/context.md (ADR과 충돌 확인)

체크 포인트:
1. 스킬 지침의 Feature Design 체크리스트
2. PRD 범위를 벗어나지 않는가
3. 필수 6개 산출물 섹션 완비
4. Coverage Diagram 실제로 경로를 다루는가
5. Failure Modes가 "실제 프로덕션"에서 일어날 일인가
`
)
```

---

## Phase 4: 컨펌 + 확정

### 4-1. 사용자 컨펌 루프

1. 리뷰 리포트 제시.
2. 선택지:
   - **A. 그대로 확정**: 4-2로 진행
   - **B. 특정 섹션 수정**: 대화로 수정 → design-draft 갱신 → Phase 3 재실행
   - **C. 특정 Section 재실행**: Phase 1의 Section 1~4 중 하나를 재시작
   - **D. 취소**: draft 유지, 중단
3. A 선택까지 루프.

### 4-2. 확정 (draft → docs 이동)

1. `.draft/features/<기능명>/tech-spec-draft.md` → `docs/features/<기능명>/tech-spec.md`.
2. Progress 파일에 완료 스탬프.

### 4-3. 아키텍처 영향 반영

설계 중에 시스템 구조나 데이터 모델이 바뀌어야 한다고 드러났으면 여기서 처리한다.

**작은 변경** (엔티티에 컬럼 추가, 기존 구조 안에서 해결되는 것) — `docs/data-model.md` 를 갱신하고 `/decision` 으로 ADR 을 남긴다.

**큰 변경** (새 엔티티 여러 개, 구성 요소 추가, 통신 방식 변경, 저장소 변경) — 여기서 고치지 않는다. 사용자에게 알리고 `/architecture` 를 먼저 돌리라고 안내한다.

```
⚠️ 이 설계는 시스템 구조 변경을 수반합니다.

  <무엇이 바뀌어야 하는지>

/architecture 로 구조를 먼저 정리한 뒤 이 기능으로 돌아오는 것을 권합니다.
그대로 진행하면 architecture.md 와 실제 코드가 벌어집니다.

  - "/architecture 실행"  → 구조 재검토로 전환
  - "그대로 진행"         → 경고만 기록하고 계속
```

---

## Phase 5: tasks.md 에 Task 분해 추가

### 두 층 구조 원칙

- **tasks.md** = 자연어 인덱스 (사람이 읽는, "지금 어느 단계 / 무엇 하는 중") — 단계명만
- **tech-spec.md** = 코드 수준 디테일 (AC, 함수 시그니처, 엣지 케이스) — 세션이 읽는 SoT

같은 정보를 양쪽에 중복 기록하지 말 것. tasks.md 에는 자연어 단계만, 코드 수준 AC는 tech-spec 에 있다고 참조.

### 실행
1. `tech-spec.md` 의 "Parallelization Strategy" + "Section 3 테스트 계획" 을 기반으로 구체 Task 도출.
2. 각 Task 에 **자연어 단계명 + Effort (S/M/L/XL)** 부여. 코드 수준 AC 는 tech-spec.md 가 SoT.
3. `docs/tasks.md` 의 Phase 1 아래 해당 기능 서브섹션에 추가.

### 형식 (자연어 인덱스 — 권장)

```markdown
### 기능: <기능명> (진행 중)

> 단계: 1/N — <첫 번째 자연어 단계명>
> 무엇: <비개발자도 이해할 수 있는 한 줄 설명>
> 다음: <다음 단계 자연어>

PRD: features/<기능명>/prd.md
설계: features/<기능명>/tech-spec.md  ← 코드 수준 AC, 시그니처는 여기

#### 단계
- [ ] 1. <자연어 단계명> [Effort]
- [ ] 2. <자연어 단계명> [Effort]
- [ ] 3. <자연어 단계명> [Effort]
- [ ] 4. 테스트 작성 [Effort]
- [ ] 5. 문서 갱신 [S]
```

### 안티패턴 (피할 것)

```markdown
❌ T1: <작업 제목>   ← T 접두사 금지. "1." 또는 자연어 단계명만
❌ Phase 1.1, 1.2   ← 중첩 Phase 코드 금지
❌ AC: validate_round_n_test() 가 round_count >= 3 일 때 ...   ← 코드 식별자/함수명 직접 노출 X. tech-spec.md 에서만.
❌ AC: <긴 측정 기준 1~5개 모두 나열>   ← tasks.md 는 인덱스. 디테일은 tech-spec.md 의 Section 3.
```

### 작은 작업 (features/ 디렉토리 안 만드는 경우)

기능 단위가 아닌 작은 보조 작업은 기존 todo 형식 사용 가능:

```markdown
- [ ] **<작업 제목>** [Effort]
  - AC: <측정 가능한 완료 기준>
  - 의존: <선행 작업> (있으면)
```

---

## Phase 6: 작업 브랜치 생성

작업 분해까지 끝났으면 이 기능의 브랜치를 만든다. 기능 이름과 범위가 확정된 시점이라 여기가 맞다. 이후 모든 `/task` 와 `/done` 이 이 브랜치에서 돌고 `/ship` 이 PR 로 올린다.

### 6-1. 현재 상태 확인

```bash
git branch --show-current
git status --short
```

- 이미 `feature/<기능명>` 에 있으면 건너뛴다
- 다른 feature 브랜치에 있으면 사용자에게 알리고 어떻게 할지 확인한다
- 커밋하지 않은 변경이 있으면 알린다. 브랜치를 만들면 그 변경이 따라온다

### 6-2. base 확인과 생성

base 는 `main` 이 기본이고 없으면 `master` 다. 프로젝트가 다르면 `git symbolic-ref refs/remotes/origin/HEAD` 로 감지한다.

```
브랜치를 만들까요?

  base:   <base>
  브랜치: feature/<기능명>

  (원격이 있으면 base 를 먼저 fetch 합니다)
```

승인하면 실행한다.

```bash
git fetch origin <base>        # 원격이 있을 때만
git checkout <base>
git merge --ff-only origin/<base>   # 원격이 있을 때만
git checkout -b feature/<기능명>
```

`--ff-only` 가 실패하면 로컬 base 가 원격과 갈라진 것이다. 자동으로 해결하지 않고 사용자에게 알린 뒤 현재 위치에서 브랜치를 딸지 확인한다.

git 저장소가 아니면 이 Phase 를 건너뛰고 그 사실을 알린다.

---

## 산출

```
✅ 기술 설계 완료 — <기능명>

생성:
- docs/features/<기능명>/tech-spec.md
- docs/tasks.md 에 작업 <N>개 추가
- 브랜치 feature/<기능명>

<아키텍처 영향이 있었으면 여기에 표시>

참조: .draft/features/<기능명>/ (진행 과정 보존)

이어서 구현을 시작할까요?
- "네" → /task 실행 (첫 작업 맥락 로드)
- "나중에" → 종료
```

### 연속 호출

사용자가 동의하면 `.claude/commands/task.md` 를 Read 로 로드하고 그 지시를 이어서 수행한다.

---

## 중단 / 재시작

- 섹션 중간 중단 시 `.draft/features/<기능명>/` 에 부분 산출물 저장 + progress 업데이트.
- Section 3 (Tests) 는 특히 길다 — Coverage Diagram 작성 중 중단되면 현재까지의 Diagram을 반드시 저장.
- 재실행 시 progress 읽고 이어서.

---

## 실패 시나리오

| 상황 | 대응 |
|---|---|
| `prd.md` 또는 `functional-spec.md` 없음 | `/feature-start <기능명>` 안내 후 중단 |
| 설계가 PRD 범위를 벗어남 | PRD 를 고칠지 설계를 좁힐지 확인 |
| 시스템 구조 변경이 필요 | Phase 4-3 의 안내대로 `/architecture` 선행 권장 |
| base 브랜치가 원격과 갈라짐 | 자동 해결하지 않고 사용자에게 알린 뒤 현재 위치에서 딸지 확인 |
| git 저장소가 아님 | Phase 6 을 건너뛰고 알림 |
| 커밋하지 않은 변경이 있음 | 브랜치에 따라온다는 사실을 알리고 진행 여부 확인 |
| Section 3 중간에 끊김 | Coverage Diagram 을 반드시 draft 에 저장 |
