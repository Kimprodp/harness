---
description: 현재 위치 요약 — 마일스톤 진행, 활성 기능, 블로커, 최근 활동, 점검 주기
---

# /project-status — 현재 위치 요약

당신(메인 AI)은 프로젝트가 지금 어디까지 왔는지 한눈에 보이게 정리한다.

**언제 쓰나**: 오랜만에 돌아왔을 때, 새 세션에서 맥락을 잡을 때, 회고 전에.

---

## 이 커맨드만의 규칙

> 말투 같은 공통 규칙은 `CLAUDE.md` 의 공통 작업 규칙을 따른다.

1. **어떤 파일도 수정하지 않는다.** 읽기 전용이다.
2. **원문을 복사하지 않는다.** 요약하고 발췌한다. 전문이 필요하면 사용자가 따로 요청한다.
3. **빠진 문서와 오래된 문서와 중단된 작업을 눈에 띄게 표시한다.**
4. **추천은 구체적으로.** "뭔가 하세요" 가 아니라 "`/task` 로 <작업> 을 이어가세요".

---

## Phase 0: 선행 체크

1. `docs/plan.md` 존재 확인. 없으면 `/kickoff` 안내 후 중단.
2. 나머지 문서 존재 확인. 빠진 것은 리포트에 경고로 표시한다.
3. `.git` 존재 확인. 없으면 git 관련 절을 생략한다.

---

## Phase 1: 수집

Read 로 로드한다.

| 문서 | 뽑을 것 |
|---|---|
| `docs/plan.md` | 제품 정의, 현재 단계 |
| `docs/milestones.md` | 진행 중 마일스톤, 완료 기준, 목표 시점, 포함 기능 상태 |
| `docs/tasks.md` | 진행 중 항목, 미완료 목록, 블로커 |
| `docs/architecture.md` | 현재 단계, 지금 정하지 않은 것 |
| `docs/context.md` | 최근 ADR, 구현 스냅샷 |
| `docs/features/*/prd.md` | 활성 기능의 한 줄 요약 |

선택적으로 읽는다.

- `.draft/kickoff-progress.md`, `.draft/features/*/*-progress.md` — 중단된 작업
- `.claude/state/security-audit.json`, `cleanup.json`, `perf-baseline.json`
- `.claude/settings.json` — 주기 설정

## Phase 2: git 활동

```bash
git branch --show-current
git log --oneline -10
git status --short
```

**문서 신선도는 git 으로 판정한다.** 문서에 적힌 날짜 필드를 보지 않는다. 손으로 관리하는 값은 실제 수정과 어긋난다.

```bash
git log -1 --format=%cd --date=short -- docs/plan.md
git log -1 --format=%cd --date=short -- docs/architecture.md
git log -1 --format=%cd --date=short -- docs/context.md
git log -1 --format=%cd --date=short -- docs/tasks.md
git log -1 --format=%cd --date=short -- docs/data-model.md
```

커밋되지 않은 변경이 있는 문서는 "미커밋 변경 있음" 으로 표시한다.

---

## Phase 3: 출력

```markdown
# 📊 Project Status — <YYYY-MM-DD HH:MM>

## 제품
- **<이름>** — <한 줄 설명>
- **단계**: <PoC / MVP / 제품화>
- **브랜치**: <현재 브랜치>

## 🎯 마일스톤

**<진행 중 마일스톤>** — 목표 <YYYY-MM>
> 완료 기준: <원문>

| 기능 | 상태 |
|---|---|
| <이름> | 완료 / 진행 / 예정 |

진행: <완료 수>/<전체 수>

<목표 시점이 지났으면 눈에 띄게 표시>

## 지금 하는 일

<tasks.md 의 진행 중 항목. 없으면 다음 후보 3개>

## 활성 기능

- **<기능명>** [PRD / 설계 / 구현 중 / 완료]
  <prd 한 줄 요약>

## 📝 최근 결정

<context.md 의 최근 ADR 3~5개. 날짜와 태그와 요약>

## ⚠️ 블로커와 미결

### 블로커
<context.md 구현 스냅샷의 블로커>

### 아키텍처 미결
<architecture.md 의 "지금 정하지 않은 것" 중 다시 볼 때가 된 것>

### 백로그 상위
<tasks.md 백로그 중 우선순위 높은 3~5개>

## 📈 최근 활동

<git log 10개>

<git status 요약>

## 🔄 중단된 작업

<.draft/ 의 progress 파일 감지 시. 어디까지 갔고 어떻게 재개하는지>

## 🩺 점검 상태

| 항목 | 마지막 | 경과 | 판정 |
|---|---|---|---|
| 보안 감사 | <date> | N일 | 🟢/🟡/🔴 |
| 기술 부채 점검 | <date> | N일 | 🟢/🟡/🔴 |
| 성능 기준선 | <date> | N일 | 🟢/🟡/⚪ |

<민감 영역 변경이 감사 이후 있었으면 목록>

## 📄 문서 신선도 (git 기준)

| 문서 | 마지막 커밋 | 경과 |
|---|---|---|
| plan.md | <date> | N일 |
| architecture.md | <date> | N일 |
| data-model.md | <date> | N일 |
| context.md | <date> | N일 |
| tasks.md | <date> | N일 |

## 🧭 다음 행동

<상황에 맞게 1~3개. 구체적으로>
```

### 판정 기준

| 항목 | 🟢 | 🟡 | 🔴 |
|---|---|---|---|
| 보안 감사 | 주기 내, 민감 변경 없음 | 주기 초과 또는 민감 변경 있음 | 주기 초과 + 민감 변경 |
| 기술 부채 | 주기 내 | 주기 초과 | 주기 2배 초과 |
| 성능 기준선 | 30일 이내 | 30일 초과 | — (⚪ 는 기준선 없음) |
| 문서 | 7일 이내 | 8~30일 | 30일 초과 |

주기 기본값은 `.claude/settings.json` 의 `reminders` 를 따른다. 보안 감사 30일, 기술 부채 45일.

**문서 신선도는 참고 지표다.** 안정된 프로젝트에서 `plan.md` 가 오래된 것은 정상이다. `tasks.md` 나 `context.md` 가 오래됐는데 커밋은 계속 쌓이고 있으면 그게 문제다. 그 경우를 짚어준다.

---

## 후속

리포트 뒤 자연 대화로 이어진다.

| 요청 | 행동 |
|---|---|
| "<기능> 자세히" | 해당 기능의 PRD 와 기능 명세 요약 |
| "<ADR> 설명" | context.md 의 해당 결정 전문 |
| "tasks 전체" | 파일 원문 출력 |
| "이어서 작업" | `/task` 로 전환 |
| "구조 점검" | `/architecture` 로 전환 |

---

## 실패 시나리오

| 상황 | 대응 |
|---|---|
| `docs/` 전체 없음 | `/kickoff` 안내 후 종료 |
| 일부 문서만 있음 | 있는 것으로 부분 리포트 + 누락 경고 |
| `.git` 없음 | git 절과 문서 신선도 절 생략. 그 사실을 표시 |
| `milestones.md` 없음 | 마일스톤 절 생략하고 생성을 권장 |
| `features/` 비어 있음 | "활성 기능 없음" |
| 문서가 한 번도 커밋되지 않음 | "미커밋" 으로 표시 |
