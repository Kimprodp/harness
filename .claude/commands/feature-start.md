---
description: 기능 정의 — 범위와 규모를 먼저 확인하고 PRD·기능 명세·화면 정의 작성
argument-hint: <기능명>
---

# /feature-start — 기능 정의

당신(메인 AI)은 새 기능을 정의한다. 시작하기 전에 **범위**와 **규모**를 확인하고, 그 답에 따라 만들 문서를 정한다.

**인자**: 기능명 (소문자와 하이픈. 예: `signup`, `booking-list`)

---

## 이 커맨드만의 규칙

> 말투, 승인 절차, 초안과 확정 구분 같은 공통 규칙은 `CLAUDE.md` 의 공통 작업 규칙을 따른다.

1. **범위와 규모를 먼저 묻는다.** 문서를 만들기 시작한 뒤에 "사실 작은 작업이었다" 가 되면 시간을 버린다.
2. **작은 작업에 문서를 만들지 않는다.** `tasks.md` 항목 하나로 끝낸다.
3. **제품 방향과 충돌하면 중단하고 확인받는다.** `plan.md` 나 `architecture.md` 와 어긋나는 기능은 그 문서를 먼저 고쳐야 한다.

---

## Phase 0: 선행 체크

### 0-1. 맥락 로드

- `docs/plan.md`, `docs/architecture.md`, `CLAUDE.md` 를 Read. 없으면 `/kickoff` 안내 후 중단.
- `docs/data-model.md` 가 있으면 함께 Read.
- 기능명이 소문자와 하이픈인지 확인.

### 0-2. 기존 상태

`docs/features/<기능명>/` 이 있으면 사용자에게 확인한다. 덮어쓸지(기존은 `.backup-<timestamp>` 로), 취소할지, 기존 문서를 손볼지.

`.draft/features/<기능명>/feature-start-progress.md` 가 있으면 이어서 진행할지 물어본다.

### 0-3. 범위 확인

```
이 기능의 범위가 어디까지인가요?

  A. 백엔드만    API 와 데이터 처리. 화면 없음
  B. 프론트만    화면과 상호작용. 기존 API 사용
  C. 양쪽        API 와 화면 모두
```

범위에 따라 만들 문서와 검증 방법이 달라진다.

| 범위 | 만드는 문서 | 검증 |
|---|---|---|
| A 백엔드만 | prd, functional-spec, tech-spec | `/qa` API 모드 |
| B 프론트만 | prd, functional-spec, screens, tech-spec | `/qa` 브라우저 + `/design-review` |
| C 양쪽 | 위 전부 | 둘 다. API 계약을 먼저 확정 |

### 0-4. 규모 확인

사용자에게 기능을 한두 문장으로 설명받고 규모를 판단해 제시한다.

**작은 작업의 신호**

- 기존 화면이나 API 하나를 고치는 수준
- 새 엔티티가 없고 데이터 모델이 안 바뀜
- 하루 안에 끝날 것으로 보임
- 사용자 스토리가 하나뿐

```
이 작업은 문서 없이 진행해도 될 것 같습니다.

  <판단 근거 — 예: 기존 목록 화면에 정렬 옵션 하나 추가, 데이터 모델 변경 없음>

  A. 문서 없이 진행 → docs/tasks.md 에 항목 하나 추가하고 끝냅니다
  B. 문서 만들기   → PRD 부터 정식으로 진행합니다
```

**A 를 선택하면** `docs/tasks.md` 의 현재 마일스톤 아래에 항목을 추가하고 커맨드를 종료한다.

```markdown
- [ ] **<작업 제목>** [S/M]
  - AC: <측정 가능한 완료 기준>
```

그리고 안내한다.

```
✅ docs/tasks.md 에 추가했습니다.

구현을 시작하려면 /task 를 실행하세요.
나중에 규모가 커지면 /feature-start <기능명> 으로 다시 시작해도 됩니다.
```

**B 를 선택하거나 큰 작업이면** Phase 1 로 간다.

### 0-5. 작업 공간 준비

`.draft/features/<기능명>/` 생성. progress 파일 초기화.

```markdown
# Feature Start Progress — <기능명>
- **Started**: YYYY-MM-DD HH:MM
- **범위**: A 백엔드만 / B 프론트만 / C 양쪽
- [ ] Phase 1 — 기능 배경과 목표
- [ ] Phase 2 — 동작 규칙
- [ ] Phase 3 — 화면 정의 (범위 B, C)
- [ ] Phase 4 — 검토와 확정
```

---

## Phase 1: 기능 배경과 목표 (PRD)

### 1-1. 수요 확인 (축약)

**Skill 도구로 `idea-validation` 스킬 로드.** 기능 단위이므로 핵심 세 가지만 묻는다.

- 이 기능이 필요하다는 증거는 무엇인가 (사용자 요청, 사용 데이터, 외부 사례)
- 이 기능이 가장 필요한 사용자 한 명을 구체적으로 (직업, 상황, 겪는 문제)
- 이번 주에 낼 수 있는 가장 작은 형태는 무엇인가

프로덕트 레벨에서 이미 검증된 항목은 생략한다. 다만 **제품 방향과 충돌한다고 판단되면** 사용자에게 확인한다.

### 1-2. 목표와 범위 (축약)

**Skill 도구로 `product-spec` 스킬 로드.** 다섯 섹션만 진행한다.

- 가치 제안
- 이 기능의 하위 기능들
- 제품 차별점에 어떻게 기여하는가
- 성공 지표와 실패 신호
- 범위 경계 (포함, 제외, 나중에)

### 1-3. PRD 작성

`.claude/templates/feature-prd-template.md` 를 로드해 채운다. 채우지 못한 항목은 `<TBD: 이유>` 로 표시하고 사용자에게 확인한다.

`.draft/features/<기능명>/prd-draft.md` 저장.

---

## Phase 2: 동작 규칙 (기능 명세)

`.claude/templates/functional-spec-template.md` 를 로드해 채운다.

### 2-1. 기능 목록 뽑기

PRD 의 하위 기능들을 목록으로 만든다. 각각이 하나의 완결된 동작이어야 한다.

### 2-2. 기능마다 규칙 정하기

입력, 처리 규칙, 출력, 예외 처리, 권한, 상태 변화를 채운다.

**규칙을 사용자에게 묻지 말고 먼저 제시한다.** PRD 와 기존 문서에서 유추할 수 있는 것은 안을 내고 확인받는다. 판단이 갈리는 지점만 질문한다.

예를 들어 "비밀번호는 8자 이상" 같은 것은 제시하고, "인증 메일을 며칠 안에 확인해야 하는가" 처럼 정책에 해당하는 것은 묻는다.

### 2-3. 경계값과 예외 상황

빈 값, 최대 길이 초과, 중복 요청, 동시 수정. 각각의 기대 동작을 정한다.

`docs/data-model.md` 의 동시 수정 대비 항목을 참조한다. 대비가 없는 엔티티인데 이 기능에서 동시 수정이 일어날 수 있으면 그 사실을 기록한다.

### 2-4. 데이터 영향

이 기능이 어떤 엔티티를 만들고 고치고 지우는지 표로 정리한다.

**새 엔티티가 필요하면** 사용자에게 알리고 `docs/data-model.md` 갱신이 필요하다고 표시한다. 여기서 직접 고치지 않는다. 큰 변경이면 `/architecture` 를 먼저 돌리라고 안내한다.

`.draft/features/<기능명>/functional-spec-draft.md` 저장.

---

## Phase 3: 화면 정의 — 범위 B, C 만

`.claude/templates/screens-template.md` 를 로드해 채운다.

### 3-1. 화면 목록과 이동

이 기능에 필요한 화면을 나열하고, 화면 간 이동을 그린다.

### 3-2. 화면마다 구성

요소, 레이아웃, 상태별 표시(로딩, 데이터 없음, 오류, 권한 없음), 입력 검증 피드백, 문구.

**상태별 표시를 빠뜨리지 않는다.** 개발 중에 가장 많이 누락되는 부분이고, 나중에 발견하면 화면마다 다시 손봐야 한다.

### 3-3. 반응형과 접근성

`docs/architecture.md` 에 정해진 것이 있으면 따르고, 없으면 이 기능에 필요한 수준만 정한다.

`.draft/features/<기능명>/screens-draft.md` 저장.

---

## Phase 4: 검토와 확정

### 4-1. @plan-reviewer 검토

```
Agent(
  subagent_type: "plan-reviewer",
  description: "기능 정의 문서 배치 검토",
  prompt: `
다음 파일을 Feature 문서 종류로 검토하고 Plan Review Report 를 반환하라.
사용자와 대화하지 말고 리포트만 반환하라.

- .draft/features/<기능명>/prd-draft.md
- .draft/features/<기능명>/functional-spec-draft.md
- .draft/features/<기능명>/screens-draft.md (있으면)

참조 맥락:
- docs/plan.md (제품 방향과 정합한가)
- docs/architecture.md (구조 제약을 지키는가)
- docs/data-model.md (데이터 영향이 정확한가)
- docs/context.md (기존 ADR 과 충돌하는가)

체크 포인트:
1. 스킬 지침의 Feature 체크리스트
2. PRD 는 왜를, 기능 명세는 무엇이 어떻게를, 화면 정의는 표현을 담고 있는가.
   서로 자리를 침범하지 않는가
3. 예외 처리와 경계값이 빠지지 않았는가
4. 화면 정의에 상태별 표시(로딩·빈·오류·권한없음)가 있는가
5. 새 엔티티가 필요한데 data-model 갱신 표시가 없지 않은가
`
)
```

### 4-2. 컨펌 루프

리포트를 제시하고 승인을 받는다. 수정 요청이면 고치고 다시 검토한다.

### 4-3. 확정

1. `docs/features/<기능명>/` 생성
2. draft 를 옮긴다. `prd-draft.md` → `prd.md`, `functional-spec-draft.md` → `functional-spec.md`, `screens-draft.md` → `screens.md`
3. `docs/tasks.md` 갱신
   - 이 기능이 어느 마일스톤에 속하는지 `docs/milestones.md` 에서 확인. 모호하면 사용자에게 묻는다
   - 해당 마일스톤 아래에 `### 기능: <기능명>` 서브섹션 추가. 작업 분해는 `/feature-plan` 이 채운다
4. `docs/milestones.md` 의 해당 마일스톤 포함 기능 표에 행 추가
5. progress 파일에 완료 스탬프

```
✅ 기능 정의 완료 — <기능명>

생성:
- docs/features/<기능명>/prd.md
- docs/features/<기능명>/functional-spec.md
- docs/features/<기능명>/screens.md (범위 B, C)

<data-model 갱신이 필요하면 여기에 표시>

이어서 기술 설계를 진행할까요?
- "네" → /feature-plan <기능명> 실행
- "나중에" → 종료
```

### 4-4. 연속 호출

사용자가 진행에 동의하면 `.claude/commands/feature-plan.md` 를 Read 로 로드하고 그 지시를 이어서 수행한다. 기능명은 현재 값으로 치환한다.

---

## 실패 시나리오

| 상황 | 대응 |
|---|---|
| `docs/plan.md` 없음 | `/kickoff` 안내 후 중단 |
| 제품 방향과 충돌 | 중단하고 `plan.md` 를 고칠지 기능 범위를 좁힐지 확인 |
| 아키텍처 제약과 충돌 | `/architecture` 를 먼저 돌릴지 확인 |
| 새 엔티티가 여러 개 필요 | 기능이 큰 것이므로 쪼갤지 확인. 그대로 가면 `/architecture` 선행 권장 |
| 규모 판단이 애매함 | 사용자에게 맡긴다. 애매하면 문서를 만드는 쪽이 안전 |
| 범위가 도중에 바뀜 (백엔드만인 줄 알았는데 화면 필요) | Phase 3 를 추가로 수행 |
