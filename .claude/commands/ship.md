---
description: 릴리스 파이프라인 — 품질 게이트 자동 통과 + 버전 bump + CHANGELOG + 커밋/푸시/PR 생성.
argument-hint: [옵션 — 예: "patch", "minor", "major", "--strict", "--skip-qa"]
---

# /ship — 릴리스 파이프라인

당신(메인 AI)은 현재 feature 브랜치를 PR 까지 자동 정리한다.
품질 게이트는 **자동 통과**, 실제 push/PR 생성은 **사용자 승인 후**.

**다른 커맨드와의 관계**:
- 내부적으로 `@reviewer`, `@security` 에이전트 호출 (코드 리뷰 / 보안)
- 필요 시 `/qa` 와 `/design-review` 호출 권장 (자동 아님, 사용자 승인)
- `/update-docs` 를 완료 후 연속 호출 제안

---

## 이 커맨드만의 규칙

> 말투, 승인 절차, 커밋과 푸시 규칙 같은 공통 규칙은 `CLAUDE.md` 의 공통 작업 규칙을 따른다.

1. **base 브랜치에서 실행하지 않는다.** `main` 이나 `master` 면 즉시 중단한다.
2. **품질 게이트는 자동, 커밋과 푸시와 PR 은 승인 후.** 검사는 알아서 돌리고 되돌리기 어려운 행동만 확인받는다.
3. **merge 충돌을 자동으로 해결하지 않는다.** 사용자가 해결한 뒤 재실행한다.
4. **주기 초과나 미완료 항목은 경고까지만.** 차단은 `--strict` 일 때만 한다.
5. **재실행해도 안전해야 한다.** 검증은 다시 돌리고 이미 끝난 행동은 건너뛴다.
6. **스키마 변경은 그냥 넘기지 않는다.** 되돌리는 방법이 없으면 차단한다.

전제로 `.git` 이 있어야 하고, GitHub PR 은 `gh` 가 있으면 자동으로 만들고 없으면 URL 을 안내한다.

---

## Phase 0: Pre-Flight

### 0-1. 브랜치 검증
```bash
git branch --show-current
```
- `main`/`master` → **즉시 중단**: "base 브랜치에서는 /ship 실행 불가"
- feature 브랜치 OK → 진행

### 0-2. 원격 설정 확인
```bash
git remote -v
```
원격 없으면 경고: "원격 없음 — push 단계 건너뜀"

### 0-3. Working tree 상태
```bash
git status --short
```
- uncommitted 변경 있음 → **자동 포함** 예정 (사용자에게 알림)
- 충돌(unmerged) 상태 → 경고 후 중단

### 0-4. 인자 해석

| 인자 | 의미 |
|---|---|
| (없음) | 자동 bump (MICRO/PATCH) |
| `patch` | 강제 patch bump |
| `minor` | minor bump |
| `major` | major bump |
| `--strict` | 주기 초과·미완료 todo 등으로 **차단** 강화 |
| `--skip-qa` | /qa 제안 건너뜀 |
| `--skip-design` | /design-review 제안 건너뜀 |

---

## Phase 1: Base Merge

### 1-1. Base 브랜치 추정
- 기본: `main` (없으면 `master`)
- 사용자 프로젝트가 다르면 자동 감지 (`git symbolic-ref refs/remotes/origin/HEAD`)

### 1-2. Fetch + Merge
```bash
git fetch origin <base>
git merge --no-edit origin/<base>
```

**충돌 발생 시**:
- 충돌 파일 목록 표시
- **자동 해결 시도 금지**. 사용자에게 "해결 후 /ship 재실행" 안내 + 중단

**Fast-forward 또는 자동 3-way merge 성공 시** 진행.

---

## Phase 2: 품질 게이트 (병렬 가능)

### 2-1. 테스트 — CI 가 있으면 CI 결과를, 없으면 로컬 실행

**먼저 CI 설정을 감지한다.**

| 감지 파일 | CI |
|---|---|
| `.github/workflows/*.yml` | GitHub Actions |
| `.gitlab-ci.yml` | GitLab CI |
| `Jenkinsfile` | Jenkins |
| `.circleci/config.yml` | CircleCI |

**CI 가 있으면** 로컬에서 테스트를 다시 돌리지 않는다. 같은 검사를 두 번 하는 것이고 기준이 서로 어긋날 수 있다. 대신 이번 브랜치의 최신 커밋에 대한 CI 결과를 확인한다.

```bash
gh run list --branch <현재 브랜치> --limit 1        # gh 가 있을 때
```

`gh` 가 없거나 GitHub 이 아니면 사용자에게 확인한다.

```
CI 설정이 감지됐습니다: <종류>

이 브랜치의 CI 결과를 확인해주세요.
  - 통과했으면 "통과"
  - 실패했으면 "실패" (무엇이 실패했는지 알려주시면 반영합니다)
  - 아직 안 돌았으면 "대기" (푸시 후 확인하겠습니다)
```

아직 푸시하지 않아 CI 가 돌지 않았으면, Phase 5 에서 푸시한 뒤 결과를 확인하고 PR 생성 전에 다시 판단한다.

**CI 가 없으면** 로컬에서 러너를 감지해 실행한다.

| 감지 파일 | 명령 |
|---|---|
| `package.json` + `"test"` 스크립트 | `npm test` |
| `pom.xml` | `mvn test` |
| `build.gradle` / `build.gradle.kts` | `gradle test` |
| `pubspec.yaml` | `flutter test` |
| `pyproject.toml` | `pytest` |
| `Cargo.toml` | `cargo test` |

실패 시 이번 브랜치가 도입한 것인지 base 에서도 깨져 있던 것인지 구분한다. 이번 브랜치 탓이면 차단하고, 기존 실패면 사용자에게 확인한다.

러너를 못 찾으면 🟡 경고만 하고 차단하지 않는다.

### 2-2. 커버리지 (선택)
커버리지 도구 감지 시 실행 (jest --coverage, pytest --cov 등).
결과 임계 미달 → `--strict` 면 차단, 기본은 경고.

### 2-3. @reviewer 배치 호출
`/code-review` 내부 로직과 동일하게 Agent tool 로 `reviewer` 호출. diff 범위: `<base>..HEAD`.
- 🚨 Critical → 차단
- ⚠️ Warning → 경고

### 2-4. @security 조건부 호출
diff 에 민감 키워드 (`auth`, `login`, `payment`, `token`, `oauth`, `api_key`, `password`) 감지 또는
`docs/features/<관련>/` 이 민감 영역이면 `@security` 자동 호출.

`/security-audit` 의 state 파일 확인:
```
.claude/state/security-audit.json → last_audit.date
```
- 30일 초과 + 민감 영역 변경 → 🟡 **경고** ("보안 감사가 오래됨. `/security-audit` 권장")
- `--strict` + 주기 초과 → 🔴 **차단**

### 2-5. UI 변경 감지 → /qa, /design-review 제안

diff 에서 FE 영역 변경 감지 (`.tsx`, `.jsx`, `.vue`, `.svelte`, `.dart`, CSS) + `--skip-qa` / `--skip-design` 아니면:

```
UI 변경 감지됨. 다음 실행 권장:
  1. /qa --standard   (기능 검증)
  2. /design-review   (시각 품질)

지금 실행할까요? (건너뛰려면 N)
```

Y → 각 커맨드 파일 Read 해서 Phase 지시 대로 실행 후 이어서 Phase 3.
N → 기록만 하고 Phase 3.

### 2-6. 새 의존성 / 아키텍처 변경 감지 → /decision 제안

diff 에서 다음 감지 시:
- `package.json`, `pubspec.yaml`, `pom.xml`, `Cargo.toml`, `pyproject.toml` 등의 **dependencies 추가**
- `docker-compose.yml`, `Dockerfile` 신규 / 대폭 변경
- 아키텍처 레벨 디렉토리 신규 (`events/`, `workers/`, `queue/`, `sagas/`)

해당 결정의 **ADR 기록 여부** 확인:
- `docs/context.md` 에서 관련 키워드(새 의존성 이름 등) 로 ADR 있는지 스캔
- 없으면 🟡 경고:

```
⚠️ 새 의존성 / 아키텍처 변경 감지, 관련 ADR 없음:
  - <감지 항목>

**`/decision`** 으로 먼저 기록하고 오시는 것을 권장합니다.
(채택 이유 / 거절 대안 / 영향을 남겨두지 않으면 나중에 맥락 증발)

- "지금 /decision 실행" / Y → 커맨드 파일 Read 후 실행
- "무시하고 진행" / N → 경고만 기록, Phase 3 진행
```

`--strict` + ADR 누락이면 🔴 차단.

### 2-6b. 스키마 변경 감지 → 롤백 계획 확인

diff 에서 데이터 구조 변경을 감지한다.

- 마이그레이션 디렉토리의 파일 추가 (`migrations/`, `db/migrate/`, `alembic/`, `flyway/`, `prisma/migrations/`)
- 엔티티나 모델 클래스의 컬럼 추가·삭제·타입 변경
- `schema.sql`, `schema.prisma`, `*.ddl` 변경

감지되면 확인한다. **제품 개발에서 되돌리기가 가장 어려운 변경이다.**

```
🗄 스키마 변경이 감지됐습니다.

  <변경 내용 요약>

확인이 필요합니다.
  1. docs/data-model.md 가 이 변경을 반영하고 있나요?
  2. 되돌리는 방법이 있나요? (down 마이그레이션 또는 절차)
  3. 기존 데이터는 어떻게 되나요? (컬럼 삭제나 타입 변경이면 특히)
```

**차단 조건**

- 컬럼 삭제나 타입 변경인데 되돌리는 방법이 없음 → 🔴 차단
- `docs/data-model.md` 가 갱신되지 않음 → 🟡 경고. `--strict` 면 차단

`docs/data-model.md` 의 "스키마 변경 절차" 절에 정해진 방식이 있으면 그것을 따랐는지 확인한다.

### 2-6c. 성능 회귀 확인 (선택)

`.claude/state/perf-baseline.json` 이 있고 diff 에 데이터 조회나 API 핸들러 변경이 있으면 알린다.

```
📈 성능 기준선이 저장돼 있습니다. 이번 변경이 조회 경로를 건드렸습니다.

/perf 로 재측정하는 것을 권합니다. 기준선 대비 느려졌는지 확인됩니다.

지금 실행할까요? (건너뛰려면 N)
```

Y 면 `.claude/commands/perf.md` 를 Read 로 로드해 실행하고 돌아온다. 악화가 나오면 🟡 경고, `--strict` 면 차단.

### 2-7. cleanup 주기 체크 → /cleanup 제안 (선택)

`.claude/state/cleanup.json` 의 `last_cleanup.date` 확인.
- 없거나 `cleanup_interval_days` (기본 45일) 초과 → 🟡 **경고**:

```
🧹 마지막 cleanup: N일 전 (기준 45일)
   /cleanup 으로 기술 부채 점검 권장.

지금 실행할까요? (건너뛰려면 N)
```

Y → `.claude/commands/cleanup.md` Read 후 실행 → 완료 후 Phase 3 로 복귀.
N → 경고만 기록.

`--strict` 면 차단 (매우 오래된 경우 — 2배 이상 초과).

---

## Phase 3: 계획 완성도 감사

### 3-1. tasks.md 미완료 검출
```bash
# 현재 기능 폴더 유추: diff 가장 많은 docs/features/<X>/
```
해당 기능의 `docs/tasks.md` 섹션에서 `- [ ]` 남은 항목 검출.

- **미완료 있음** → 사용자 선택:
  - 차단 (현재 기능을 완전 완성 후 ship)
  - deferral (미완료는 tasks.md 에 남기고 이번 ship 에선 생략)
  - 무시 (소수 항목)
- **미완료 없음** → 다음

### 3-2. Scope Drift 감지
`docs/features/<X>/prd.md` 의 Acceptance Criteria 대비 diff 범위 비교:
- AC 에 없는 영역 변경 → 🟡 경고 (의도적 확장 / 예상 외 변경 구분 필요)
- 사용자에게 "이 변경 의도한 것 맞나?" 1회 확인

---

## Phase 4: 버전 + CHANGELOG

### 4-1. 자동 버전 bump 판정

diff 분석 → bump type 제안:
- 버그 수정만 (fix:) → **patch**
- 기능 추가 (feat:, add:) → **minor**
- 파괴적 변경 (BREAKING / API 제거) → **major** (사용자 확인 필수)

인자로 명시됐으면 우선.

### 4-2. 버전 파일 bump
```bash
node .claude/scripts/ship/bump-version.js --type <patch|minor|major>
```

결과 JSON 파싱. 변경된 파일 목록 보고.

### 4-3. CHANGELOG 생성/갱신
```bash
node .claude/scripts/ship/changelog-gen.js --version <new-version>
```

CHANGELOG.md 가 없던 프로젝트:
```
CHANGELOG.md 가 없습니다. 지금 생성할까요? (권장)
```
Y → 새로 생성하며 엔트리 추가. N → 건너뜀.

### 4-4. 사용자 확인

```
버전 bump 완료:
  - VERSION: 0.3.1 -> 0.3.2 (patch)
  - package.json: 동일 반영

CHANGELOG.md 에 엔트리 추가:
  [엔트리 프리뷰]

이대로 커밋할까요?
```

---

## Phase 5: 커밋 · 푸시 · PR (사용자 승인 필요)

### 5-1. 커밋 초안

```
커밋 대상:
  - 변경된 버전 파일
  - CHANGELOG.md
  - (Phase 0 uncommitted 변경이 있었다면 그것들도)

커밋 메시지 초안:
  ship: <기능명> <버전>

  Phase 4 의 CHANGELOG 엔트리 요약
```

사용자 승인 후:
```bash
git add <변경 파일들>
git commit -m "..."
```

### 5-2. Push

```
푸시 대상: origin/<현재 브랜치>

진행할까요?
```

승인 후:
```bash
git push -u origin <현재 브랜치>
```

### 5-3. PR 생성

`gh` CLI 감지:
```bash
command -v gh
```

**있으면**:
```bash
gh pr create --title "..." --body "..."
```

**없으면** PR 정보 출력 후 사용자가 수동 생성:
```
PR 수동 생성 필요:
  URL: https://github.com/<owner>/<repo>/pull/new/<branch>
  
  제목 (복사용): "ship: <기능> <버전>"
  
  본문 (복사용):
  ## 변경 내용
  [CHANGELOG 엔트리]
  
  ## 품질 게이트
  - 테스트: ✅ 통과
  - @reviewer: ✅ 이슈 없음
  - (해당 시) @security: ✅ 이슈 없음
  - (해당 시) /qa: ✅ 통과
  - (해당 시) /design-review: 🟡 이슈 2건 (tasks.md 등재)
```

---

## Phase 6: 후속 정리

### 6-1. `/update-docs` 연속 호출 제안

```
🚀 /ship 완료 (PR #<번호>).

이어서 /update-docs 로 문서 갱신할까요?
  - docs/context.md 에 Implementation Snapshot 추가
  - 필요 시 ADR 추가
  - tasks.md 기능 아카이브 이동

(원하지 않으면 N)
```

Y → `.claude/commands/update-docs.md` Read 해서 이어서 수행.

### 6-2. state 파일 갱신 (선택)

민감 영역 변경 있었으면 `.claude/state/security-audit.json` 의 `sensitive_changes_since_last_audit` 에 추가 (기능 완료 기록). 이 부분은 `/task` 완료 감지와 중복될 수 있으므로 이미 기록됐으면 skip.

---

## Idempotency (재실행 동작)

`/ship` 을 두 번 실행하면:
- ✅ **Verification 단계**는 전부 재실행 (테스트, 리뷰, 보안, plan 감사)
- ⏭️ **Action 단계**는 멱등 처리:
  - 버전 이미 bump 됐으면 **skip** (VERSION 파일 diff 없음)
  - CHANGELOG 엔트리 이미 있으면 **skip**
  - 커밋 이미 있으면 **skip**
  - push 이미 됐으면 **skip**
  - PR 이미 있으면 **업데이트** (제목/본문)

---

## 실패 시나리오 대응

| 상황 | 대응 |
|---|---|
| base 브랜치 실행 | 즉시 중단 + 사유 보고 |
| merge 충돌 | 충돌 파일 나열 + 사용자 해결 안내 + 중단 |
| CI 가 아직 안 돌았음 | Phase 5 에서 푸시한 뒤 결과를 확인하고 PR 생성 전 재판단 |
| CI 실패 | 무엇이 실패했는지 확인. 이번 변경 탓이면 차단 |
| 테스트 러너 미감지 (CI 도 없음) | 🟡 경고 후 진행 |
| @reviewer Critical 발견 | 🔴 차단. 수정 후 재실행 권장 |
| 스키마 변경인데 되돌리는 방법 없음 | 🔴 차단. 롤백 절차를 먼저 마련 |
| 스키마 변경인데 data-model.md 미갱신 | 🟡 경고. `--strict` 면 차단 |
| 성능 기준선 대비 악화 | 🟡 경고. `--strict` 면 차단 |
| 커버리지 미달 (strict) | 차단 + 부족 경로 리포트 |
| gh CLI 없음 | PR URL·제목·본문 출력 후 수동 생성 안내 |
| bump-version 실패 | 어느 파일을 올릴지 사용자에게 확인 |
| changelog-gen 에서 커밋 0개 | "변경 없음" 안내 후 종료 |
