# harness

새 프로젝트에 `.claude/` 폴더를 떨궈 넣으면 기획부터 릴리스까지 정해진 순서로 움직이게 만드는 개인용 작업 틀. Claude Code 위에서 돈다.

아이디어만 있는 개인 프로젝트와 기획이 이미 끝난 회사 제품을 모두 받는다. 시작점만 갈라지고 그다음 개발 과정은 같다.

---

## 설치

```bash
# 대상 프로젝트 폴더로 이동한 뒤
bash <harness경로>/install.sh
```

Windows PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File <harness경로>\install.ps1
```

`.claude/` 를 복사하고, `.gitignore` 에 런타임 경로를 추가하고, npm 의존성을 설치한다. Playwright 브라우저는 물어보고 설치한다. 없어도 기본 커맨드는 다 돈다.

설치가 끝나면 프로젝트에서 Claude Code 를 열고 `/kickoff` 로 시작한다.

---

## 언제 무엇을 쓰나

커맨드를 외울 필요는 없다. 각 커맨드가 끝날 때 다음에 할 것을 제안하고, 대화 중 관련 상황이 감지되면 힌트가 뜬다. 아래는 직접 부르고 싶을 때의 목록이다.

| 지금 하려는 것 | 커맨드 |
|---|---|
| 프로젝트를 처음 연다 | `/kickoff` |
| 새 기능을 만든다 | `/feature-start` |
| 코드를 쓴다 | `/task` → `/done` (반복) |
| 기능이 다 됐다 | `/code-review` → `/qa` → `/ship` |
| 버그인데 원인을 모르겠다 | `/investigate` |
| 방금 뭔가 결정했다 | `/decision` |
| 오랜만에 돌아왔다 | `/project-status` |
| 단계가 올라간다 / 구조가 이상하다 | `/architecture` |
| 마일스톤이 끝났다 | `/compile-spec` |
| 느려진 것 같다 | `/perf` |
| 화면이 어색하다 | `/design-review` |
| 어수선하다 | `/cleanup` |
| 보안이 걱정된다 | `/security-audit` |
| 문서가 밀렸다 | `/update-docs` |

대부분의 날은 `/task` 와 `/done` 만 쓴다. 나머지는 특정 순간에만 필요하다.

### 헷갈리기 쉬운 짝

| | |
|---|---|
| `/feature-plan` vs `/architecture` | 기능 하나의 설계 vs 시스템 전체의 구조 |
| `/decision` vs `/update-docs` | 결정 한 건을 지금 기록 vs 세션 끝에 여러 개 일괄 |
| `/investigate` vs `/code-review` | 왜 안 되는지 원인 찾기 vs 코드 품질 보기 |
| `/qa` vs `/perf` vs `/design-review` | 동작하는가 vs 빠른가 vs 보기 좋은가 |

---

## 흐름

### 프로젝트를 처음 열 때

```
/kickoff
  │
  │  새로 시작하는 아이디어인가, 기획이 이미 있는가
  │
  ├─ 새로 시작 ──→ 아이디어 검증 → 제품 정의 → 범위 조정
  └─ 기획 있음 ──→ 기존 기획 문서 읽기
  │
  ▼
/architecture 를 내부 호출
  요구 수집 → 데이터 모델 → 기술 선택 → 시스템 구조 → 코드 구조
  │
  ▼
docs/ 확정 + CI 설정 확인
```

아키텍처는 묻기만 하지 않는다. 수집한 사실을 근거로 안을 먼저 내고, 얻는 것과 잃는 것과 다른 안을 함께 설명한다. 결정마다 **"나중에 이런 게 보이면 다시 본다"** 는 조건을 같이 적어 둔다.

### 기능 하나를 만들 때

```
/feature-start <이름>    범위(백엔드/프론트/양쪽)와 크기를 먼저 확인
   ↓                     작은 기능이면 tasks.md 한 줄로 끝
/feature-plan <이름>     기술 설계 + task 분해 + 브랜치 생성
   ↓
/task                    할 일 하나 진입, 관련 문서 자동 로드
   ↓   [구현 대화]
/done                    AC 검증 → 체크오프 → 커밋
   ↓   (다음 할 일로 반복)
/code-review · /qa       리뷰와 동작 검증
   ↓
/ship                    CI 확인 → 버전 → CHANGELOG → PR
```

### 단계가 올라갈 때

`/architecture` 를 다시 부른다. 문서가 이미 있으므로 진단부터 돈다. 문서에 적힌 구조와 실제 코드가 벌어졌는지, 처음에 적어둔 재검토 조건이 실제로 나타났는지를 코드 근거와 함께 리포트한다. 그 결과를 보고 필요한 부분만 다시 설계한다.

---

## 만들어지는 문서

```
프로젝트 루트/
├── README.md                 제품 개요와 실행 방법 — 자동 생성
├── CLAUDE.md                 프로젝트 규칙과 코드 약속
└── docs/
    ├── plan.md               제품 방향 — 6개월 뒤에도 그대로일 것만
    ├── milestones.md         언제까지 무엇을 내고 무엇이 되면 끝인가
    ├── architecture.md       시스템 구조 — 현재 상태만
    ├── data-model.md         어떤 데이터를 어떤 관계로 어디에
    ├── context.md            왜 그렇게 결정했는가 (ADR)
    ├── tasks.md              지금 무엇을 하고 다음에 무엇을 하는가
    ├── spec-index.md         전체 기능 명세 — 자동 생성
    ├── screens-index.md      전체 화면 목록 — 자동 생성
    └── features/<이름>/
        ├── prd.md            왜 만드는가
        ├── functional-spec.md 무엇이 어떻게 동작하는가
        ├── screens.md        어떻게 보이고 조작되는가
        └── tech-spec.md      어떤 코드로 만드는가
```

기능 폴더는 범위와 크기에 따라 달라진다. 백엔드만 만드는 기능에는 `screens.md` 가 없고, 작은 기능은 폴더 자체를 만들지 않는다.

`architecture.md` 는 항상 현재 상태만 담는다. 왜 바뀌었는지는 전부 `context.md` 의 ADR 이 갖는다.

---

## 구성

| 층 | 내용 |
|---|---|
| 커맨드 | 사용자 진입점. 메인 세션이 직접 대화하며 수행 |
| 에이전트 | 배치로 돌며 리포트만 반환. `@plan-reviewer` 문서 검토, `@architect` 아키텍처 진단, `@reviewer` 코드 리뷰, `@security` 보안 감사 |
| 스킬 | 인터뷰와 판정의 매뉴얼. 커맨드가 불러 쓴다 |
| 훅 | 프롬프트에서 상황을 감지해 힌트 주입, 보안·정리 주기 상기 |
| 스크립트 | Playwright 기반 검증, 버전 범프, 체인지로그 |

`@plan-reviewer` 는 문서만 보고 `@reviewer` 는 변경된 코드만 본다. `@architect` 는 그 사이를 본다.

---

## 설계 원칙

**되돌리기 어려운 것만 먼저 정한다.** 데이터 저장 방식, 서비스 분리, 동기와 비동기, 인증 방식, 외부에 여는 API 규격은 처음에 정한다. 캐시, 읽기 복제본, 파티셔닝, 서버 대수는 필요해진 다음에 붙인다.

**확장 지점을 열어두되 확장을 구현하지 않는다.** DB 접근을 한 계층에 모으고, 외부 호출을 인터페이스 뒤에 두고, 모듈 경계를 지킨다. 만드는 비용은 거의 없고 안 해두면 나중 비용이 크다.

**재기 전에 최적화하지 않는다.** 대신 재는 장치를 먼저 넣는다.

**개별 문서가 정본이고 취합본은 생성물이다.** 기능별로 쓰고 `/compile-spec` 이 모은다.

**최신 상태만 남긴다.** 문서를 고칠 때 이력 문구를 본문에 남기지 않는다. 이력은 ADR 과 git 이 갖는다.

**사용자가 모른다고 전제하고 먼저 제시한다.** 나중에 바꾸면 비싼 결정은 사용자가 말해주기를 기다리지 않는다. 안을 먼저 내고 트레이드오프를 함께 설명한다.

---

## 문서

- [docs/spec.md](docs/spec.md) — 하네스 구조의 정본. 프로세스, 문서 세트, 커맨드, 원칙
- [docs/progress.md](docs/progress.md) — 진행 이력과 결정 로그
- [CLAUDE.md](CLAUDE.md) — 하네스 자체를 개발할 때의 맥락

---

## 요구 사항

- Claude Code
- Node.js 18+ (일부 커맨드가 사용. 없어도 기본 커맨드는 동작)
- git

---

## 참고

- [gstack](https://github.com/garrytan/gstack) (MIT) — `idea-validation`, `scope-review`, `tech-stack-decision` 의 원형
- [diet103/claude-code-infrastructure-showcase](https://github.com/diet103/claude-code-infrastructure-showcase) (MIT) — 문서 시스템과 훅 구조

## 라이선스

MIT
